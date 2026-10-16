<script setup lang="ts">
// KS-04 Invoice & Kwitansi (preview cetak A4)
import logo from '~/assets/images/logo-invoice.png'
// Data dari /api/v1/cashier/bills/{visit_id}; setiap cetak dicatat di audit tagihan server.
const route = useRoute()
const toast = useToast()

const id = computed(() => String(route.params.id))
const data = ref<any>(null)
const loading = ref(true)
const galat = ref('')
watch(id, async () => {
  loading.value = true
  try {
    data.value = await kasirApi.tagihan(id.value)
    galat.value = ''
  } catch (e: any) {
    data.value = null
    galat.value = pesanKasir(e)
  } finally {
    loading.value = false
  }
}, { immediate: true })
const v = computed(() => data.value?.v)
const pt = computed(() => data.value?.p)
const bill = computed(() => data.value?.b)
const items = computed(() => bill.value?.items || [])
const totals = computed(() => bill.value?.totals || { total: 0, diskon: 0, net: 0, penjamin: 0, pasien: 0, selisih: 0, bayar: 0, sisa: 0 })
const siap = computed(() => bill.value && bill.value.status !== 'draf')
const lunas = computed(() => bill.value?.status === 'lunas')
const bayar = computed(() => bill.value?.payments || [])
const tunai = computed(() => bayar.value.find((p: any) => p.metode === 'Tunai'))
const terakhir = computed(() => bayar.value[bayar.value.length - 1])
const nik = computed(() => (pt.value?.nik ? pt.value.nik.slice(0, 4) + '••••••••' + pt.value.nik.slice(-4) : '-'))
onMounted(() => { try { localStorage.setItem(KS_AKTIF_KEY, id.value) } catch {} })

const LABEL: Record<string, string> = { Tindakan: 'Tindakan', 'Obat/resep': 'Obat / resep', Lainnya: 'Lainnya' }
const baris = computed(() => items.value.map((i: any) => ({ ...i, label: i.kategori === 'Administrasi' ? 'Administrasi / karcis' : i.kategori === 'Konsultasi' ? i.nama : `${LABEL[i.kategori] || 'Lainnya'} · ${i.nama}` })))
const adaLainnya = computed(() => items.value.some((i: any) => !['Administrasi', 'Konsultasi', 'Tindakan', 'Obat/resep'].includes(i.kategori)))
const sumber = (i: any) => `${String(i.sumber || '-').replace(/^KL-05 · /, '')} · ${fmtJam(i.at)}`
const metodeTeks = computed(() => [...new Set(bayar.value.map((p: any) => p.metode))].join(' + ') || '-')

// barcode visual dari nomor INV (demo, bukan standar barcode)
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const bars = computed(() => {
  let x = hash(bill.value?.noInv || 'INV') || 1
  const out: { x: number; w: number }[] = []
  let pos = 2
  for (let i = 0; i < 60; i++) {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0
    const w = 1 + (x % 3)
    if (i % 2 === 0) out.push({ x: pos, w })
    pos += w + 1 + ((x >> 3) % 2)
  }
  return { list: out, width: pos + 2 }
})

const cetak = async (label: string) => {
  if (!(await aksiKasir(() => kasirApi.catatCetak(id.value, label === 'unduh PDF' ? 'pdf' : 'print')).then((r: unknown) => r !== undefined))) return
  toast.ok(label === 'unduh PDF' ? 'Pilih "Simpan sebagai PDF" pada dialog cetak' : 'Membuka dialog cetak · tercatat audit')
  setTimeout(() => window.print(), 150)
}
</script>

<template>
  <div v-if="v && pt && bill">
    <div class="no-print">
      <PageHead code="KS-04" role="Kasir" title="Invoice & Kwitansi" subtitle="Dokumen pembayaran lunas · Preview cetak A4" />
      <PatientBanner :patient="pt" :visit="v" />
    </div>

    <div v-if="!siap" class="guide warn no-print">Invoice terbit setelah tagihan difinalkan.&nbsp;<NuxtLink :to="'/kasir/' + id">Kembali ke tagihan</NuxtLink>.</div>

    <div v-else class="kl-cols" style="grid-template-columns: minmax(0, 1fr) 290px">
      <div class="inv-doc">
        <div class="inv-head">
          <img :src="logo" alt="SIMRS SPKD" width="100" height="75" class="inv-logo">
          <div class="inv-rs">
            <b>RS SPKD · Demo</b>
            <span>Jl. Pelayanan No. 1, Bandung · Tel. 022 0000 100</span>
            <span class="muted">SIMRS SPKD · RAWAT JALAN</span>
          </div>
          <span class="badge" :class="lunas ? 'b-ok' : 'b-warn'">{{ lunas ? 'LUNAS' : 'BELUM LUNAS' }}</span>
        </div>
        <h2 class="inv-title">{{ lunas ? 'INVOICE & KWITANSI' : 'INVOICE' }}</h2>

        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Identitas</th><th>Detail</th></tr></thead>
            <tbody>
              <tr><td>Invoice / Kwitansi</td><td class="val">{{ bill.noInv }} / {{ bill.noKw || '-' }}</td></tr>
              <tr><td>Pasien / RM</td><td class="val">{{ pt.nama }} / {{ pt.rm }} · NIK {{ nik }}</td></tr>
              <tr><td>Kunjungan</td><td class="val">{{ v.noKunjungan }} · {{ v.poliKode || v.poliNama }} · {{ v.dokterNama }}</td></tr>
              <tr><td>Penjamin</td><td class="val">{{ labelSkema(bill.skema) }} · {{ fmtTglPanjang(v.tanggal).replace(/^\w+, /, '') }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Layanan</th><th>Sumber</th><th>Tarif</th><th>Qty</th><th>Subtotal</th></tr></thead>
            <tbody>
              <tr v-for="i in baris" :key="i.id"><td>{{ i.label }}</td><td>{{ sumber(i) }}</td><td>{{ fmtRp(i.tarif) }}</td><td>{{ i.qty }}</td><td class="val">{{ fmtRp(i.subtotal) }}</td></tr>
              <tr v-if="!adaLainnya"><td>Lainnya</td><td>Tidak ada item</td><td>{{ fmtRp(0) }}</td><td>0</td><td class="val">{{ fmtRp(0) }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Ringkasan pembayaran</th><th>Nominal</th></tr></thead>
            <tbody>
              <tr><td>Subtotal / diskon</td><td class="val">{{ fmtRp(totals.total) }} / {{ fmtRp(totals.diskon) }}</td></tr>
              <tr><td>Ditanggung penjamin</td><td class="val">{{ fmtRp(totals.penjamin) }}</td></tr>
              <tr><td>TOTAL PASIEN</td><td class="val">{{ fmtRp(totals.pasien) }}</td></tr>
              <tr v-if="tunai?.diterima"><td>Tunai diterima / kembalian</td><td class="val">{{ fmtRp(tunai.diterima) }} / {{ fmtRp(tunai.kembalian || 0) }}</td></tr>
              <tr><td>Sisa tagihan</td><td class="val">{{ fmtRp(totals.sisa) }}</td></tr>
            </tbody>
          </table>
        </div>

        <p v-if="lunas">Metode: {{ metodeTeks }} · Dibayar {{ fmtTgl(terakhir?.at) }}, {{ fmtJam(terakhir?.at) }} · Kasir: {{ terakhir?.kasir }}</p>
        <p v-else class="muted">Belum ada pembayaran.</p>
        <p class="bold">Terbilang: {{ terbilang(totals.pasien) }}.</p>
        <svg :viewBox="`0 0 ${bars.width} 42`" width="240" height="42" preserveAspectRatio="none" role="img" :aria-label="'Barcode ' + bill.noInv" shape-rendering="crispEdges"><rect v-for="(b, i) in bars.list" :key="i" :x="b.x" y="0" :width="b.w" height="42" fill="#000" /></svg>
        <p class="muted" style="font-size: 11px">{{ bill.noInv }} · Visual barcode demo</p>
      </div>

      <div class="kl-col no-print">
        <div class="panel">
          <h2>Dokumen siap cetak</h2>
          <div><span class="badge" :class="lunas ? 'b-ok' : 'b-warn'">{{ lunas ? 'Tagihan lunas' : 'Tagihan final · belum lunas' }}</span></div>
          <div class="kl-actions">
            <button class="btn btn-primary" @click="cetak('cetak')">Cetak</button>
            <button class="btn" @click="cetak('unduh PDF')">Unduh PDF</button>
          </div>
          <div><button class="btn" disabled>Kirim WA · ditunda</button></div>
          <div class="guide"><AppIcon name="info" :size="18" /> Setiap cetak dan cetak ulang dicatat audit, termasuk petugas, waktu, dan nomor dokumen.</div>
          <p class="muted">INV dan KW berasal dari layanan penomoran. Tidak dapat diedit manual.</p>
          <NuxtLink v-if="!lunas" :to="'/kasir/' + id + '/bayar'" class="btn">Ke pembayaran</NuxtLink>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="card"><p class="muted">Memuat tagihan…</p></div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><p v-if="galat" class="muted">{{ galat }}</p><NuxtLink to="/kasir" class="btn">Kembali</NuxtLink></div>
</template>

<style scoped>
.inv-doc { background: #fff; border: 1px solid var(--line); padding: 40px; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.inv-doc p { margin: 0; font-size: 13px; line-height: 1.45; }
.inv-head { display: flex; gap: 16px; align-items: flex-start; }
.inv-logo { width: 100px; height: 75px; object-fit: contain; flex: none; }
.inv-rs { flex: 1; display: flex; flex-direction: column; gap: 6px; font-size: 12px; line-height: 1.45; }
.inv-rs b { font-size: 22px; font-weight: 600; color: var(--text); }
.inv-title { font-size: 25px; font-weight: 600; color: var(--navy); margin: 0; }
.val { color: var(--teal-d); }
@media (max-width: 767px) { .inv-doc { padding: 18px; gap: 16px; } .inv-head { flex-wrap: wrap; } }
</style>
<style>
@media print {
  body:has(.inv-doc) .no-print { display: none !important; }
  body:has(.inv-doc) .inv-doc { border: 0; padding: 0; }
  body:has(.inv-doc) .kl-cols { display: block; }
}
</style>
