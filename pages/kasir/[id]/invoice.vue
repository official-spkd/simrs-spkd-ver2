<script setup lang="ts">
// KS-04 Invoice & Kwitansi
const route = useRoute()
const { db, visit, patient, poli, doctor, billItems, billTotals, audit } = useDb()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const items = computed(() => billItems(id.value))
const totals = computed(() => billTotals(id.value))
const fmt = ref<'a4' | '80'>('a4')
const siap = computed(() => bill.value && bill.value.status !== 'draf')
const kasir = computed(() => bill.value?.payments?.[0]?.kasir || '-')

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
  <div v-if="v && pt && bill">
    <div class="no-print"><PageHead code="KS-04" role="Kasir" title="Invoice & Kwitansi" :crumbs="['Kasir', 'Detail tagihan', 'Invoice']" /></div>
    <div class="row no-print" style="margin-bottom:14px">
      <NuxtLink :to="'/kasir/' + id" class="btn">Kembali ke tagihan</NuxtLink>
      <div class="seg" role="group" aria-label="Ukuran kertas"><button type="button" :class="{ on: fmt === 'a4' }" @click="fmt = 'a4'">A4</button><button type="button" :class="{ on: fmt === '80' }" @click="fmt = '80'">Struk 80 mm</button></div>
      <button class="btn btn-primary" :disabled="!siap" @click="cetak('cetak')">Cetak</button>
      <button class="btn" :disabled="!siap" @click="cetak('unduh PDF')">Unduh PDF</button>
      <button class="btn" disabled title="Ditunda">Kirim WA (ditunda)</button>
    </div>

    <div v-if="!siap" class="alert warn no-print"><span>Invoice terbit setelah tagihan difinalkan. <NuxtLink :to="'/kasir/' + id">Kembali ke tagihan</NuxtLink>.</span></div>

    <div v-else class="card inv" :class="{ w80: fmt === '80' }">
      <div class="row between" style="align-items:flex-start">
        <div>
          <div class="bold" style="font-size:20px;color:var(--navy)">RS SPKD</div>
          <div class="muted small">Jl. Kesehatan No. 1, Bandung · Telp (022) 555-0100</div>
        </div>
        <div style="text-align:right">
          <div class="bold">{{ bill.status === 'lunas' ? 'INVOICE & KWITANSI' : 'INVOICE' }}</div>
          <div class="mono small">{{ bill.noInv }}</div>
          <div v-if="bill.noKw" class="mono small">{{ bill.noKw }}</div>
          <StatusBadge :value="bill.status" />
        </div>
      </div>
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
      <div class="grid g2" style="gap:12px">
        <dl class="kv"><dt>Pasien</dt><dd>{{ pt.nama }}</dd><dt>No. RM</dt><dd>{{ pt.rm }}</dd><dt>Umur / JK</dt><dd>{{ umur(pt.tglLahir) }} th / {{ pt.jk }}</dd></dl>
        <dl class="kv"><dt>No. kunjungan</dt><dd>{{ v.noKunjungan }}</dd><dt>Tanggal</dt><dd>{{ fmtTgl(v.tanggal) }}</dd><dt>Poli / Dokter</dt><dd>{{ poli(v.poliId).nama }} / {{ doctor(v.doctorId).nama }}</dd></dl>
      </div>

      <div class="table-wrap" style="margin-top:14px">
        <table class="tbl">
          <thead><tr><th>Uraian</th><th class="right">Tarif</th><th class="right">Qty</th><th class="right">Subtotal</th></tr></thead>
          <tbody>
            <tr v-for="i in items" :key="i.id"><td>{{ i.nama }}<div class="muted small">{{ i.kategori }}</div></td><td class="right">{{ fmtRp(i.tarif) }}</td><td class="right">{{ i.qty }}</td><td class="right">{{ fmtRp(i.subtotal) }}</td></tr>
          </tbody>
        </table>
      </div>

      <dl class="kv" style="grid-template-columns:1fr auto;margin-top:14px;margin-left:auto;max-width:360px">
        <dt>Subtotal</dt><dd class="right">{{ fmtRp(totals.total) }}</dd>
        <dt>Diskon</dt><dd class="right">- {{ fmtRp(totals.diskon) }}</dd>
        <dt class="bold">Total</dt><dd class="right bold">{{ fmtRp(totals.net) }}</dd>
        <dt>Penjamin ({{ bill.skema }})</dt><dd class="right">{{ fmtRp(totals.penjamin) }}</dd>
        <dt class="bold">Dibayar pasien</dt><dd class="right bold">{{ fmtRp(totals.pasien) }}</dd>
      </dl>

      <div v-if="bill.payments.length" style="margin-top:14px">
        <div class="bold small">Pembayaran</div>
        <div v-for="p in bill.payments" :key="p.id" class="row between small"><span>{{ p.metode }}<template v-if="p.ref"> · {{ p.ref }}</template> · {{ fmtWaktu(p.at) }}</span><b>{{ fmtRp(p.jumlah) }}</b></div>
      </div>
      <div v-else class="muted small" style="margin-top:14px">Belum ada pembayaran.</div>

      <div class="row between" style="margin-top:20px;align-items:flex-end">
        <div class="small">Kasir<br><br><b>{{ kasir }}</b></div>
        <div class="center">
          <svg :viewBox="`0 0 ${bars.width} 40`" :width="bars.width" height="40" role="img" :aria-label="'Barcode ' + bill.noInv" shape-rendering="crispEdges"><rect v-for="(b, i) in bars.list" :key="i" :x="b.x" y="0" :width="b.w" height="40" fill="#000" /></svg>
          <div class="mono small">{{ bill.noInv }}</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><NuxtLink to="/kasir" class="btn">Kembali</NuxtLink></div>
</template>

<style>
.inv { max-width: 794px; margin: 0 auto; }
.inv.w80 { max-width: 302px; font-size: 12px; }
.inv.w80 .g2 { grid-template-columns: 1fr; }
@media print {
  .inv { max-width: none; padding: 0; margin: 0; }
  .inv.w80 { max-width: 80mm; }
}
</style>
