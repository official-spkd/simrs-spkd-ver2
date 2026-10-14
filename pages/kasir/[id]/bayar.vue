<script setup lang="ts">
// KS-03 Pembayaran
const route = useRoute()
const { db, visit, patient, billTotals, pay } = useDb()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const totals = computed(() => billTotals(id.value))
const lunas = computed(() => bill.value?.status === 'lunas')
const sisa = computed(() => totals.value.sisa)

// ---- baris pembayaran ----
interface Line { key: number; metode: 'Tunai' | 'QRIS' | 'VA'; jumlah: number; diterima: number; paid: boolean; qrAt: number | null; qrPayAt: number | null }
let seq = 0
const lines = ref<Line[]>([])
const newLine = (jumlah = 0): Line => ({ key: ++seq, metode: 'Tunai', jumlah, diterima: 0, paid: false, qrAt: null, qrPayAt: null })
const resetLines = () => { lines.value = [newLine(sisa.value)] }
onMounted(() => { if (!lunas.value) resetLines() })
const now = ref(Date.now())
let t1: any, t2: any
onMounted(() => {
  t1 = setInterval(() => (now.value = Date.now()), 1000)
  // polling status gateway tiap 2 detik (simulasi)
  t2 = setInterval(() => {
    lines.value.forEach((l) => { if (l.metode === 'QRIS' && l.qrPayAt && !l.paid && Date.now() >= l.qrPayAt) { l.paid = true; toast.ok(`QRIS Rp ${l.jumlah.toLocaleString('id-ID')} diterima`) } })
  }, 2000)
})
onBeforeUnmount(() => { clearInterval(t1); clearInterval(t2) })

const alokasi = computed(() => lines.value.reduce((s, l) => s + (Number(l.jumlah) || 0), 0))
const kurang = computed(() => Math.max(0, sisa.value - alokasi.value))
const tambahBaris = () => { lines.value.push(newLine(kurang.value)) }
const hapusBaris = (k: number) => { lines.value = lines.value.filter((l) => l.key !== k); if (!lines.value.length) resetLines() }
const ubahMetode = (l: Line, m: any) => { l.metode = m; l.paid = false; l.qrAt = null; l.qrPayAt = null; l.diterima = 0 }
const siapLine = (l: Line) => (Number(l.jumlah) > 0) && (l.metode === 'Tunai' ? Number(l.diterima) >= Number(l.jumlah) : l.paid)
const kembalian = (l: Line) => Math.max(0, Number(l.diterima) - Number(l.jumlah))
const bisaBayar = computed(() => lines.value.length > 0 && lines.value.every(siapLine) && alokasi.value >= sisa.value)

// ---- QRIS ----
const QR_SIM_DETIK = 10
const buatQr = (l: Line) => {
  if (!(Number(l.jumlah) > 0)) { toast.err('Isi jumlah QRIS terlebih dahulu'); return }
  l.qrAt = Date.now(); l.qrPayAt = Date.now() + QR_SIM_DETIK * 1000; l.paid = false
  toast.info('QR dibuat — menunggu pembayaran (simulasi gateway)')
}
const batalQr = (l: Line) => { l.qrAt = null; l.qrPayAt = null; l.paid = false; toast.warn('QR dibatalkan') }
const sisaDetik = (l: Line) => (l.qrPayAt ? Math.max(0, Math.ceil((l.qrPayAt - now.value) / 1000)) : 0)
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const qrCells = (seed: string) => {
  const N = 25
  let x = hash(seed) || 1
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296 }
  const cells: { x: number; y: number }[] = []
  const inFinder = (i: number, j: number) => (i < 8 && j < 8) || (i > N - 9 && j < 8) || (i < 8 && j > N - 9)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (!inFinder(i, j) && rnd() > 0.52) cells.push({ x: i, y: j })
  return cells
}
const qrSeed = (l: Line) => `${bill.value?.noInv}|${l.key}|${l.jumlah}|${l.qrAt}`

// ---- VA ----
const vaNo = (l: Line) => '8808' + String(hash(`${bill.value?.noInv}|va|${l.key}`)).padStart(10, '0').slice(0, 10) + '01'
const simulasiVa = (l: Line) => { l.paid = true; toast.ok('Pembayaran VA diterima (simulasi)') }

// ---- bayar ----
const bayar = () => {
  if (!bisaBayar.value) { toast.err('Pembayaran belum lengkap'); return }
  const parts = lines.value.map((l) => ({ metode: l.metode, jumlah: Number(l.jumlah), ref: l.metode === 'VA' ? vaNo(l) : l.metode === 'QRIS' ? 'QR-' + bill.value.noInv : '' }))
  const tunaiLine = lines.value.find((l) => l.metode === 'Tunai')
  const kb = tunaiLine ? kembalian(tunaiLine) : 0
  toast.attempt(() => pay(id.value, parts), kb > 0 ? `Pembayaran lunas. Kembalian ${fmtRp(kb)}` : 'Pembayaran lunas')
}
const selesaikanTanpaBayar = () => toast.attempt(() => pay(id.value, []), 'Kunjungan diselesaikan tanpa pembayaran pasien')
const kembaliTerakhir = computed(() => {
  const p = bill.value?.payments || []
  return p
})
</script>

<template>
  <div v-if="v && pt && bill">
    <PageHead code="KS-03" role="Kasir" title="Pembayaran" :crumbs="['Kasir', 'Detail tagihan', 'Pembayaran']">
      <template #actions><NuxtLink :to="'/kasir/' + id" class="btn">Kembali ke tagihan</NuxtLink></template>
    </PageHead>
    <PatientBanner :patient="pt" :visit="v"><div class="f"><small>No. INV</small><b class="mono">{{ bill.noInv || '-' }}</b></div></PatientBanner>

    <div v-if="bill.status === 'draf'" class="alert warn"><span>Tagihan belum difinalkan. <NuxtLink :to="'/kasir/' + id">Finalkan dahulu</NuxtLink>.</span></div>

    <div v-else-if="lunas" class="card center">
      <div class="badge b-ok" style="font-size:14px">LUNAS</div>
      <div class="bignum">{{ fmtRp(totals.pasien) }}</div>
      <p>No. kwitansi <b class="mono">{{ bill.noKw }}</b></p>
      <div class="table-wrap" style="margin:14px auto;max-width:520px;text-align:left">
        <table class="tbl rtable"><thead><tr><th>Metode</th><th class="right">Jumlah</th><th>Waktu</th></tr></thead>
          <tbody>
            <tr v-for="p in kembaliTerakhir" :key="p.id"><td data-label="Metode">{{ p.metode }}<span v-if="p.ref" class="muted small"> · {{ p.ref }}</span></td><td data-label="Jumlah" class="right">{{ fmtRp(p.jumlah) }}</td><td data-label="Waktu">{{ fmtJam(p.at) }}</td></tr>
          </tbody></table>
      </div>
      <div class="row" style="justify-content:center">
        <NuxtLink :to="'/kasir/' + id + '/invoice'" class="btn btn-primary btn-lg">Cetak invoice & kwitansi</NuxtLink>
        <NuxtLink to="/kasir" class="btn btn-lg">Kembali ke worklist</NuxtLink>
      </div>
    </div>

    <div v-else class="split-r">
      <div class="stack">
        <div v-if="totals.pasien === 0" class="card">
          <h2>Tidak ada pembayaran pasien</h2>
          <p class="muted">Porsi pasien Rp 0 ({{ bill.skema }}). Konfirmasi untuk menyelesaikan kunjungan.</p>
          <div class="row" style="margin-top:12px"><button class="btn btn-primary btn-lg" @click="selesaikanTanpaBayar">Selesaikan (tanpa pembayaran pasien)</button></div>
        </div>

        <template v-else>
          <div v-for="(l, idx) in lines" :key="l.key" class="card">
            <div class="row between"><h3>Pembayaran {{ idx + 1 }}</h3>
              <div class="row"><StatusBadge :value="siapLine(l) ? 'lunas' : 'menunggu'" /><button v-if="lines.length > 1" class="btn btn-sm btn-danger" @click="hapusBaris(l.key)">Hapus</button></div></div>
            <div class="seg" style="margin:10px 0" role="group" aria-label="Metode bayar">
              <button v-for="m in ['Tunai', 'QRIS', 'VA']" :key="m" type="button" :class="{ on: l.metode === m }" @click="ubahMetode(l, m)">{{ m === 'VA' ? 'Virtual Account' : m }}</button>
            </div>
            <div class="form-grid">
              <div class="field"><label :for="'j' + l.key">Jumlah (Rp)</label><input :id="'j' + l.key" v-model.number="l.jumlah" class="input" type="number" min="0" inputmode="numeric" :disabled="(l.metode !== 'Tunai' && !!l.qrAt) || l.paid && l.metode === 'VA'"></div>
              <div v-if="l.metode === 'Tunai'" class="field"><label :for="'d' + l.key">Uang diterima (Rp)</label><input :id="'d' + l.key" v-model.number="l.diterima" class="input" type="number" min="0" inputmode="numeric"></div>
            </div>
            <div v-if="l.metode === 'Tunai'" style="margin-top:10px">
              <div class="row"><button class="btn btn-sm" @click="l.diterima = Number(l.jumlah)">Uang pas</button>
                <button v-for="n in [50000, 100000, 200000]" :key="n" class="btn btn-sm" @click="l.diterima = n">{{ fmtRp(n) }}</button></div>
              <p style="margin-top:8px">Kembalian: <b style="font-size:18px">{{ fmtRp(kembalian(l)) }}</b></p>
              <p v-if="Number(l.diterima) > 0 && Number(l.diterima) < Number(l.jumlah)" class="err-text">Uang diterima kurang {{ fmtRp(Number(l.jumlah) - Number(l.diterima)) }}</p>
            </div>
            <div v-else-if="l.metode === 'QRIS'" style="margin-top:12px" class="center">
              <template v-if="!l.qrAt"><button class="btn btn-primary" @click="buatQr(l)">Buat QR dinamis</button></template>
              <template v-else>
                <svg viewBox="0 0 25 25" width="200" height="200" role="img" aria-label="Kode QRIS dinamis" shape-rendering="crispEdges" style="background:#fff;border:1px solid var(--line);padding:8px">
                  <g fill="#0d2c4a"><rect v-for="(c, i) in qrCells(qrSeed(l))" :key="i" :x="c.x" :y="c.y" width="1" height="1" />
                    <template v-for="p in [[0, 0], [18, 0], [0, 18]]" :key="p.join()">
                      <rect :x="p[0]" :y="p[1]" width="7" height="7" /><rect :x="p[0] + 1" :y="p[1] + 1" width="5" height="5" fill="#fff" /><rect :x="p[0] + 2" :y="p[1] + 2" width="3" height="3" />
                    </template></g>
                </svg>
                <p style="margin-top:8px"><b>{{ fmtRp(l.jumlah) }}</b> · <span v-if="l.paid" class="badge b-ok">Dibayar</span><span v-else class="badge b-warn">Menunggu pembayaran… simulasi lunas dalam {{ sisaDetik(l) }} dtk</span></p>
                <button v-if="!l.paid" class="btn btn-danger btn-sm" style="margin-top:8px" @click="batalQr(l)">Batalkan QR</button>
              </template>
            </div>
            <div v-else style="margin-top:12px">
              <div class="alert info"><span>Nomor Virtual Account: <b class="mono" style="font-size:18px">{{ vaNo(l) }}</b></span></div>
              <div class="row" style="margin-top:8px"><button class="btn" :disabled="l.paid || !(Number(l.jumlah) > 0)" @click="simulasiVa(l)">Simulasi bayar</button><span v-if="l.paid" class="badge b-ok">Dibayar</span></div>
              <p class="hint">Tombol simulasi hanya tersedia di staging.</p>
            </div>
          </div>
          <div class="row"><button class="btn" :disabled="kurang <= 0" @click="tambahBaris">+ Tambah metode (gabungan)</button></div>
        </template>
      </div>

      <div class="card center" style="position:sticky;top:76px">
        <small class="muted">Sisa tagihan</small>
        <div class="bignum">{{ fmtRp(sisa) }}</div>
        <dl class="kv" style="grid-template-columns:1fr auto;text-align:left">
          <dt>Total tagihan</dt><dd class="right">{{ fmtRp(totals.net) }}</dd>
          <dt>Ditanggung penjamin</dt><dd class="right">{{ fmtRp(totals.penjamin) }}</dd>
          <dt>Dialokasikan</dt><dd class="right">{{ fmtRp(alokasi) }}</dd>
          <dt>Kurang dialokasikan</dt><dd class="right" :style="kurang ? 'color:var(--err)' : ''">{{ fmtRp(kurang) }}</dd>
        </dl>
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:14px" :disabled="!bisaBayar || totals.pasien === 0" @click="bayar">Bayar</button>
      </div>
    </div>
  </div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><NuxtLink to="/kasir" class="btn">Kembali</NuxtLink></div>
</template>
