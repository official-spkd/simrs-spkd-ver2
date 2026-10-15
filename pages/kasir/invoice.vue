<script setup lang="ts">
// KS-04 Invoice & Kwitansi
const route = useRoute()
const router = useRouter()
const { db, visit, patient, poli, doctor, billItems, billTotals, audit, tagihanList } = useDb()
const toast = useToast()

// Tanpa ?id= (dibuka dari sidebar): pakai tagihan lunas terakhir, lalu yang final.
const defaultId = () => {
  const l = tagihanList().filter((v: any) => db.bills[v.id] && db.bills[v.id].status !== 'draf')
  return (l.find((v: any) => db.bills[v.id].status === 'lunas') || l[0])?.id || ''
}
const id = computed(() => String(route.query.id || defaultId()))
const pilih = (x: string) => router.replace({ query: { id: x } })
const v = computed(() => (id.value ? visit(id.value) : null))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const items = computed(() => (bill.value && bill.value.status !== 'draf' ? billItems(id.value) : []))
const totals = computed(() => billTotals(id.value))
const fmt = ref<'a4' | '80'>('a4')
const siap = computed(() => bill.value && bill.value.status !== 'draf')
const lunas = computed(() => bill.value?.status === 'lunas')
const pays = computed(() => bill.value?.payments || [])
const lastPay = computed(() => pays.value[pays.value.length - 1])
const kasir = computed(() => lastPay.value?.kasir || '-')
const metode = computed(() => [...new Set(pays.value.map((p: any) => p.metode))].join(' + ') || (totals.value.pasien === 0 ? bill.value?.skema : '-'))
const tunai = computed(() => pays.value.filter((p: any) => p.metode === 'Tunai'))
const diterima = computed(() => tunai.value.reduce((s: number, p: any) => s + (p.diterima ?? p.jumlah), 0))
const kembali = computed(() => Math.max(0, diterima.value - tunai.value.reduce((s: number, p: any) => s + p.jumlah, 0)))
const sisa = computed(() => totals.value.sisa)

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const bars = computed(() => {
  const s = bill.value?.noInv || 'INV'
  let x = hash(s) || 1
  const out: { x: number; w: number }[] = []
  let pos = 4
  for (let i = 0; i < 48; i++) {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0
    const w = 1 + (x % 3)
    if (i % 2 === 0) out.push({ x: pos, w })
    pos += w + (1 + ((x >> 3) % 2))
  }
  return { list: out, width: pos + 4 }
})

const cetak = (label: string) => {
  audit('cetak invoice', `${bill.value.noInv} · ${v.value.noKunjungan}`, label)
  toast.ok(label === 'unduh PDF' ? 'Gunakan "Simpan sebagai PDF" pada dialog cetak' : 'Membuka dialog cetak')
  setTimeout(() => window.print(), 150)
}
</script>

<template>
  <div>
    <div class="no-print">
      <PageHead code="KS-04" role="Kasir" title="Invoice & Kwitansi" :subtitle="`Dokumen pembayaran ${lunas ? 'lunas' : 'tagihan'} · Preview cetak ${fmt === 'a4' ? 'A4' : 'struk 80 mm'}`" />
      <KasirPicker :model-value="id" :statuses="['lunas', 'final']" label="Dokumen tagihan" @update:model-value="pilih" />
    </div>

    <template v-if="v && pt && bill">
      <div class="no-print"><KasirBanner :patient="pt" :visit="v" /></div>
      <div v-if="!siap" class="alert warn no-print"><span>Invoice terbit setelah tagihan difinalkan. <NuxtLink :to="'/kasir/' + id">Kembali ke tagihan</NuxtLink>.</span></div>

      <div v-else class="split-r" style="grid-template-columns: minmax(0, 1fr) 300px">
        <div class="doc-paper" :class="{ w80: fmt === '80' }" style="max-width: 860px; width: 100%">
          <div class="doc-head">
            <div class="row" style="flex-wrap: nowrap; align-items: flex-start; gap: 14px">
              <div class="doc-logo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0b8f95" stroke-width="2.4" stroke-linecap="round"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg></div>
              <div>
                <div class="bold" style="font-size: 22px; color: var(--navy)">RS SPKD · Demo</div>
                <div class="small">Jl. Pelayanan No. 1, Bandung · Tel. 022 0000 100</div>
                <div class="muted small">SIMRS SPKD · RAWAT JALAN</div>
              </div>
            </div>
            <span class="tag" :class="lunas ? 't-ok' : 't-warn'">{{ lunas ? 'LUNAS' : 'BELUM LUNAS' }}</span>
          </div>

          <h2 class="doc-title">{{ lunas ? 'INVOICE & KWITANSI' : 'INVOICE' }}</h2>

          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Identitas</th><th>Detail</th></tr></thead>
              <tbody>
                <tr class="row-hl"><td>Invoice / Kwitansi</td><td class="num-link">{{ bill.noInv }}<template v-if="bill.noKw"> / {{ bill.noKw }}</template></td></tr>
                <tr><td>Pasien / RM</td><td class="num-link">{{ pt.nama }} / {{ pt.rm }} · NIK {{ maskNik(pt.nik) }}</td></tr>
                <tr><td>Kunjungan</td><td class="num-link">{{ v.noKunjungan }} · {{ poli(v.poliId).kode }} · {{ doctor(v.doctorId).nama }}</td></tr>
                <tr><td>Penjamin</td><td class="num-link">{{ v.penjamin }} · {{ fmtTglPanjang(v.tanggal).split(', ')[1] }}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Layanan</th><th>Sumber</th><th>Tarif</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="(i, n) in items" :key="i.id" :class="{ 'row-hl': n === 0 }">
                  <td>{{ i.nama }}</td><td>{{ i.sumber }} · {{ fmtJam(i.at) }}</td><td>{{ fmtRp(i.tarif) }}</td><td>{{ i.qty }}</td><td class="num-link">{{ fmtRp(i.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Ringkasan pembayaran</th><th>Nominal</th></tr></thead>
              <tbody>
                <tr class="row-hl"><td>Subtotal / diskon</td><td class="num-link">{{ fmtRp(totals.total) }} / {{ fmtRp(totals.diskon) }}</td></tr>
                <tr><td>Ditanggung penjamin</td><td class="num-link">{{ fmtRp(totals.penjamin) }}</td></tr>
                <tr><td>TOTAL PASIEN</td><td class="num-link">{{ fmtRp(totals.pasien) }}</td></tr>
                <tr v-if="tunai.length"><td>Tunai diterima / kembalian</td><td class="num-link">{{ fmtRp(diterima) }} / {{ fmtRp(kembali) }}</td></tr>
                <tr v-else-if="lunas"><td>Dibayar</td><td class="num-link">{{ fmtRp(totals.bayar) }}</td></tr>
                <tr><td>Sisa tagihan</td><td class="num-link">{{ fmtRp(sisa) }}</td></tr>
              </tbody>
            </table>
          </div>

          <p v-if="lunas" style="margin-top: 18px">Metode: {{ metode }} · Dibayar {{ lastPay ? fmtWaktu(lastPay.at) : '-' }} · Kasir: {{ kasir }}</p>
          <p v-else class="muted" style="margin-top: 18px">Belum ada pembayaran · Tagihan final {{ fmtWaktu(bill.finalAt) }}</p>
          <p class="bold" style="margin-top: 16px">Terbilang: {{ terbilang(totals.pasien) }}</p>

          <div style="margin-top: 18px">
            <svg :viewBox="`0 0 ${bars.width} 44`" :width="bars.width * 1.4" height="56" role="img" :aria-label="'Barcode ' + bill.noInv" shape-rendering="crispEdges"><rect v-for="(b, i) in bars.list" :key="i" :x="b.x" y="0" :width="b.w" height="44" fill="#0b3558" /></svg>
            <div class="muted small" style="margin-top: 8px">{{ bill.noInv }} · Visual barcode demo</div>
          </div>
        </div>

        <div class="card no-print">
          <h2>Dokumen siap cetak</h2>
          <span class="tag" :class="lunas ? 't-ok' : 't-warn'">{{ lunas ? 'Tagihan lunas' : 'Tagihan final · belum lunas' }}</span>
          <div class="row" style="margin-top: 16px"><button class="btn btn-primary" @click="cetak('cetak')">Cetak</button><button class="btn" @click="cetak('unduh PDF')">Unduh PDF</button></div>
          <div class="row" style="margin-top: 10px"><button class="btn" disabled title="Ditunda">Kirim WA · ditunda</button></div>
          <div class="seg" style="margin-top: 14px" role="group" aria-label="Ukuran kertas"><button type="button" :class="{ on: fmt === 'a4' }" @click="fmt = 'a4'">A4</button><button type="button" :class="{ on: fmt === '80' }" @click="fmt = '80'">Struk 80 mm</button></div>
          <div class="alert" style="margin-top: 16px"><span>Setiap cetak dan cetak ulang dicatat audit, termasuk petugas, waktu, dan nomor dokumen.</span></div>
          <p class="muted small" style="margin-top: 14px">INV dan KW berasal dari layanan penomoran. Tidak dapat diedit manual.</p>
          <div class="row" style="margin-top: 14px"><NuxtLink :to="'/kasir/' + id" class="btn btn-sm">Kembali ke tagihan</NuxtLink></div>
        </div>
      </div>
    </template>

    <div v-else class="card no-print">
      <h2>Belum ada invoice</h2>
      <p class="muted" style="margin: 8px 0 14px">Invoice terbit setelah tagihan difinalkan di Worklist Tagihan.</p>
      <NuxtLink to="/kasir" class="btn btn-primary">Buka Worklist Tagihan</NuxtLink>
    </div>
  </div>
</template>
