<script setup lang="ts">
// KS-03 Pembayaran (Tunai / QRIS / VA simulasi / multi-payment)
const route = useRoute()
const router = useRouter()
const { db, visit, patient, billTotals, pay, tagihanList } = useDb()
const toast = useToast()

// Tanpa ?id= (dibuka dari sidebar): pakai tagihan final yang belum dibayar, bila tak ada pakai yang terakhir lunas.
const defaultId = () => {
  const l = tagihanList().filter((v: any) => db.bills[v.id] && db.bills[v.id].status !== 'draf')
  return (l.find((v: any) => db.bills[v.id].status === 'final') || l[0])?.id || ''
}
const id = computed(() => String(route.query.id || defaultId()))
const pilih = (x: string) => router.replace({ query: { id: x } })
const v = computed(() => (id.value ? visit(id.value) : null))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const totals = computed(() => billTotals(id.value))
const lunas = computed(() => bill.value?.status === 'lunas')
const sisa = computed(() => totals.value.sisa)
const labelSkema = computed(() => (bill.value?.skema === 'Tunai' ? 'Umum' : bill.value?.skema))

// ---- baris pembayaran ----
type Metode = 'Tunai' | 'QRIS' | 'VA'
interface Line { key: number; metode: Metode; jumlah: number; diterima: number; paid: boolean; qrAt: number | null; qrPayAt: number | null }
let seq = 0
const tab = ref<'tunai' | 'qris' | 'va' | 'multi'>('tunai')
const TAB_METODE: Record<string, Metode> = { tunai: 'Tunai', qris: 'QRIS', va: 'VA' }
const TABS = [{ key: 'tunai', label: 'Tunai' }, { key: 'qris', label: 'QRIS · Simulasi' }, { key: 'va', label: 'VA · Simulasi' }, { key: 'multi', label: 'Multi-payment' }]
const newLine = (jumlah = 0, metode: Metode = 'Tunai'): Line => ({ key: ++seq, metode, jumlah, diterima: 0, paid: false, qrAt: null, qrPayAt: null })
const lines = ref<Line[]>([])
const resetLines = () => {
  const l = newLine(sisa.value, TAB_METODE[tab.value] || 'Tunai')
  // Contoh pecahan: uang diterima dibulatkan ke atas per Rp100.000 (Rp250.000 → Rp300.000, kembalian Rp50.000)
  if (l.metode === 'Tunai' && tab.value !== 'multi' && l.jumlah > 0) l.diterima = Math.ceil(l.jumlah / 100000) * 100000
  lines.value = [l]
}
watch([id, tab], () => { if (!lunas.value) resetLines() })
watch(sisa, (s) => { if (!lunas.value && tab.value !== 'multi' && lines.value[0] && !lines.value[0].qrAt) lines.value[0].jumlah = s })
onMounted(() => { if (!lunas.value) resetLines() })

const now = ref(Date.now())
let t1: any, t2: any
onMounted(() => {
  t1 = setInterval(() => (now.value = Date.now()), 1000)
  // polling status gateway tiap 2 detik (simulasi)
  t2 = setInterval(() => {
    lines.value.forEach((l) => { if (l.metode === 'QRIS' && l.qrPayAt && !l.paid && Date.now() >= l.qrPayAt) { l.paid = true; toast.ok(`QRIS ${fmtRp(l.jumlah)} diterima`) } })
  }, 2000)
})
onBeforeUnmount(() => { clearInterval(t1); clearInterval(t2) })

const alokasi = computed(() => lines.value.reduce((s, l) => s + (Number(l.jumlah) || 0), 0))
const kurang = computed(() => Math.max(0, sisa.value - alokasi.value))
const terbayar = computed(() => totals.value.bayar)
const tambahBaris = () => { lines.value.push(newLine(kurang.value)) }
const hapusBaris = (k: number) => { lines.value = lines.value.filter((l) => l.key !== k); if (!lines.value.length) resetLines() }
const ubahMetode = (l: Line, m: Metode) => { l.metode = m; l.paid = false; l.qrAt = null; l.qrPayAt = null; l.diterima = 0 }
const siapLine = (l: Line) => Number(l.jumlah) > 0 && (l.metode === 'Tunai' ? Number(l.diterima) >= Number(l.jumlah) : l.paid)
const kembalian = (l: Line) => Math.max(0, Number(l.diterima) - Number(l.jumlah))
const bisaBayar = computed(() => lines.value.length > 0 && lines.value.every(siapLine) && alokasi.value >= sisa.value)
const utama = computed(() => lines.value[0])

// ---- QRIS ----
const QR_SIM_DETIK = 10
const buatQr = (l: Line) => {
  if (!(Number(l.jumlah) > 0)) { toast.err('Isi jumlah QRIS terlebih dahulu'); return }
  l.qrAt = Date.now(); l.qrPayAt = Date.now() + QR_SIM_DETIK * 1000; l.paid = false
  toast.info('QR simulasi dibuat — menunggu konfirmasi (gateway simulasi)')
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
const vaDemo = computed(() => (pt.value ? `DEMO-VA-${pt.value.rm}` : ''))
const simulasiVa = (l: Line) => { l.paid = true; toast.ok('Pembayaran VA diterima (simulasi)') }

// Panel gateway di kanan: aksi cepat ke tab terkait
const panelQr = () => { tab.value = 'qris'; nextTick(() => { if (utama.value) buatQr(utama.value) }) }
const panelBatalQr = () => { const l = lines.value.find((x) => x.metode === 'QRIS' && x.qrAt); if (l) batalQr(l); else toast.warn('Belum ada QR aktif') }
const panelVa = () => { tab.value = 'va'; nextTick(() => { if (utama.value && Number(utama.value.jumlah) > 0) simulasiVa(utama.value) }) }

// ---- bayar ----
const bayar = () => {
  if (!bisaBayar.value) { toast.err('Pembayaran belum lengkap'); return }
  const parts = lines.value.map((l) => ({ metode: l.metode, jumlah: Number(l.jumlah), diterima: l.metode === 'Tunai' ? Number(l.diterima) : undefined, ref: l.metode === 'VA' ? vaNo(l) : l.metode === 'QRIS' ? 'QR-' + bill.value.noInv : '' }))
  const tunaiLine = lines.value.find((l) => l.metode === 'Tunai')
  const kb = tunaiLine ? kembalian(tunaiLine) : 0
  toast.attempt(() => pay(id.value, parts), kb > 0 ? `Pembayaran lunas. Kembalian ${fmtRp(kb)}` : 'Pembayaran lunas')
}
const selesaikanTanpaBayar = () => toast.attempt(() => pay(id.value, []), 'Kunjungan diselesaikan tanpa pembayaran pasien')
const cetak = () => navigateTo('/kasir/invoice?id=' + id.value)
const kwBerikut = computed(() => `KW-${todayStr().slice(2).replace(/-/g, '')}-${pad((db.counters[`${todayStr()}|kw`] || 0) + 1, 5)}`)
const bayaran = computed(() => bill.value?.payments || [])
const contohMetode = computed(() => (tab.value === 'multi' ? 'Multi-payment' : TABS.find((t) => t.key === tab.value)?.label.split(' ')[0]))
</script>

<template>
  <div>
    <PageHead code="KS-03" role="Kasir" title="Pembayaran" :subtitle="bill?.noInv ? `${bill.noInv} · Tagihan ${bill.status === 'lunas' ? 'lunas' : 'final'} · Skema ${labelSkema}` : 'Pilih tagihan final untuk menerima pembayaran'" />
    <KasirPicker :model-value="id" :statuses="['final', 'lunas']" label="Tagihan" @update:model-value="pilih" />

    <template v-if="v && pt && bill">
      <KasirBanner :patient="pt" :visit="v" />

      <div v-if="bill.status === 'draf'" class="alert warn"><span>Tagihan belum difinalkan. <NuxtLink :to="'/kasir/' + id">Finalkan dahulu</NuxtLink>.</span></div>

      <div v-else-if="lunas" class="card center">
        <div class="badge b-ok" style="font-size: 14px">LUNAS</div>
        <div class="bignum">{{ fmtRp(totals.pasien) }}</div>
        <p>No. kwitansi <b class="mono">{{ bill.noKw }}</b></p>
        <div class="table-wrap" style="margin: 14px auto; max-width: 520px; text-align: left">
          <table class="tbl rtable"><thead><tr><th>Metode</th><th class="right">Jumlah</th><th>Waktu</th></tr></thead>
            <tbody>
              <tr v-for="p in bayaran" :key="p.id"><td data-label="Metode">{{ p.metode }}<span v-if="p.ref" class="muted small"> · {{ p.ref }}</span></td><td data-label="Jumlah" class="right">{{ fmtRp(p.jumlah) }}</td><td data-label="Waktu">{{ fmtJam(p.at) }}</td></tr>
            </tbody></table>
        </div>
        <div class="row" style="justify-content: center">
          <NuxtLink :to="'/kasir/invoice?id=' + id" class="btn btn-primary btn-lg">Cetak invoice &amp; kwitansi</NuxtLink>
          <NuxtLink to="/kasir" class="btn btn-lg">Kembali ke worklist</NuxtLink>
        </div>
      </div>

      <div v-else class="split-r" style="grid-template-columns: minmax(0, 1fr) 380px">
        <div class="stack">
          <div v-if="totals.pasien === 0" class="card">
            <h2>Tidak ada pembayaran pasien</h2>
            <p class="muted">Porsi pasien Rp 0 ({{ labelSkema }}). Konfirmasi untuk menyelesaikan kunjungan.</p>
            <div class="row" style="margin-top: 12px"><button class="btn btn-primary btn-lg" @click="selesaikanTanpaBayar">Selesaikan (tanpa pembayaran pasien)</button></div>
          </div>

          <div v-else class="card">
            <h2>Sisa tagihan</h2>
            <div class="bignum" style="margin: 28px 0 20px">{{ fmtRp(sisa) }}</div>
            <p class="muted" style="margin-bottom: 16px">Total {{ fmtRp(totals.pasien) }} · Terbayar {{ fmtRp(terbayar) }} · Menunggu pembayaran</p>
            <div class="tabs-pill" role="tablist" aria-label="Metode pembayaran">
              <button v-for="t in TABS" :key="t.key" type="button" role="tab" :class="{ on: tab === t.key }" :aria-selected="tab === t.key" @click="tab = t.key as any">{{ t.label }}</button>
            </div>

            <template v-for="(l, idx) in lines" :key="l.key">
              <div v-if="tab === 'multi'" class="row between" style="margin-top: 14px">
                <h3>Pembayaran {{ idx + 1 }}</h3>
                <div class="row"><StatusBadge :value="siapLine(l) ? 'lunas' : 'menunggu'" /><button v-if="lines.length > 1" class="btn btn-sm btn-danger" @click="hapusBaris(l.key)">Hapus</button></div>
              </div>
              <div v-if="tab === 'multi'" class="seg" style="margin: 10px 0" role="group" aria-label="Metode bayar">
                <button v-for="m in (['Tunai', 'QRIS', 'VA'] as Metode[])" :key="m" type="button" :class="{ on: l.metode === m }" @click="ubahMetode(l, m)">{{ m === 'VA' ? 'Virtual Account' : m }}</button>
              </div>
              <div v-if="tab === 'multi'" class="field" style="margin-bottom: 12px"><label :for="'j' + l.key">Jumlah (Rp)</label><input :id="'j' + l.key" v-model.number="l.jumlah" class="input" type="number" min="0" inputmode="numeric" :disabled="(l.metode !== 'Tunai' && !!l.qrAt) || (l.paid && l.metode === 'VA')"></div>

              <div v-if="l.metode === 'Tunai'" :style="tab === 'multi' ? '' : 'margin-top: 14px'">
                <div class="field"><label :for="'d' + l.key">Uang diterima *</label><input :id="'d' + l.key" v-model.number="l.diterima" class="input" type="number" min="0" inputmode="numeric" placeholder="Rp 0"></div>
                <div class="row" style="margin-top: 8px"><button class="btn btn-sm" @click="l.diterima = Number(l.jumlah)">Uang pas</button><button v-for="n in [50000, 100000, 200000, 300000]" :key="n" class="btn btn-sm" @click="l.diterima = n">{{ fmtRp(n) }}</button></div>
                <div class="table-wrap" style="margin-top: 16px">
                  <table class="tbl">
                    <thead><tr><th>Perhitungan tunai</th><th>Nominal</th></tr></thead>
                    <tbody>
                      <tr class="row-hl"><td>Tagihan pasien</td><td class="num-link">{{ fmtRp(l.jumlah) }}</td></tr>
                      <tr><td>Uang diterima</td><td class="num-link">{{ fmtRp(l.diterima) }}</td></tr>
                      <tr><td>Kembalian otomatis</td><td class="num-link">{{ fmtRp(kembalian(l)) }}</td></tr>
                    </tbody>
                  </table>
                </div>
                <p v-if="Number(l.diterima) > 0 && Number(l.diterima) < Number(l.jumlah)" class="err-text" style="margin-top: 6px">Uang diterima kurang {{ fmtRp(Number(l.jumlah) - Number(l.diterima)) }}</p>
              </div>

              <div v-else-if="l.metode === 'QRIS'" class="center" style="margin-top: 16px">
                <template v-if="!l.qrAt"><button class="btn btn-primary" @click="buatQr(l)">Buat QR simulasi</button><p class="hint">Bukan QR produksi: tidak dapat dipindai.</p></template>
                <template v-else>
                  <svg viewBox="0 0 25 25" width="200" height="200" role="img" aria-label="Kode QRIS simulasi" shape-rendering="crispEdges" style="background: #fff; border: 1px solid var(--line); padding: 8px">
                    <g fill="#0d2c4a"><rect v-for="(c, i) in qrCells(qrSeed(l))" :key="i" :x="c.x" :y="c.y" width="1" height="1" />
                      <template v-for="p in [[0, 0], [18, 0], [0, 18]]" :key="p.join()">
                        <rect :x="p[0]" :y="p[1]" width="7" height="7" /><rect :x="p[0] + 1" :y="p[1] + 1" width="5" height="5" fill="#fff" /><rect :x="p[0] + 2" :y="p[1] + 2" width="3" height="3" />
                      </template></g>
                  </svg>
                  <p style="margin-top: 8px"><b>{{ fmtRp(l.jumlah) }}</b> · <span v-if="l.paid" class="badge b-ok">Dibayar</span><span v-else class="badge b-warn">Menunggu konfirmasi… simulasi lunas dalam {{ sisaDetik(l) }} dtk</span></p>
                  <button v-if="!l.paid" class="btn btn-danger btn-sm" style="margin-top: 8px" @click="batalQr(l)">Batalkan QR</button>
                </template>
              </div>

              <div v-else style="margin-top: 16px">
                <div class="alert info"><span>Nomor Virtual Account: <b class="mono" style="font-size: 18px">{{ vaNo(l) }}</b></span></div>
                <div class="row" style="margin-top: 8px"><button class="btn" :disabled="l.paid || !(Number(l.jumlah) > 0)" @click="simulasiVa(l)">Simulasi bayar</button><span v-if="l.paid" class="badge b-ok">Dibayar</span></div>
                <p class="hint">Tombol simulasi hanya tersedia di staging.</p>
              </div>
            </template>

            <div v-if="tab === 'multi'" class="row" style="margin-top: 14px"><button class="btn" :disabled="kurang <= 0" @click="tambahBaris">+ Tambah metode (gabungan)</button><span class="muted">Dialokasikan {{ fmtRp(alokasi) }} · kurang {{ fmtRp(kurang) }}</span></div>

            <div class="row" style="margin-top: 16px">
              <button class="btn btn-primary" :disabled="!bisaBayar" @click="bayar">Bayar</button>
              <button class="btn" @click="cetak">Cetak</button>
            </div>
            <div class="alert" style="margin-top: 16px"><span>Server menghitung ulang sisa tagihan saat Bayar. Setelah lunas, kunjungan berubah selesai → lunas dan nomor KW diterbitkan.</span></div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <h2>Gateway alternatif · simulasi</h2>
            <span class="tag t-warn">QRIS / VA · STUB MVP</span>
            <p class="bold" style="margin-top: 14px">QRIS · bukan QR produksi</p>
            <p class="muted" style="margin-top: 10px">Tidak ada QR yang dapat dipindai pada demo ini. Transaksi simulasi menunggu konfirmasi; status diperiksa berkala.</p>
            <div class="row" style="margin-top: 14px"><button class="btn" :disabled="totals.pasien === 0" @click="panelQr">Buat QR simulasi</button><button class="btn" @click="panelBatalQr">Batalkan QR</button></div>
            <p class="bold" style="margin-top: 18px">Virtual Account · demo</p>
            <input class="input" style="margin-top: 8px" :value="vaDemo" readonly aria-label="Virtual account demo">
            <button class="btn" style="margin-top: 10px" :disabled="totals.pasien === 0" @click="panelVa">Simulasi bayar VA</button>
            <p class="hint">Multi-payment dapat menggabungkan nominal tunai dan gateway simulasi.</p>
          </div>

          <div class="card">
            <h2>Setelah pembayaran berhasil</h2>
            <span class="tag t-ok">Lunas · contoh hasil</span>
            <p class="bold" style="margin-top: 14px">{{ kwBerikut }}</p>
            <p style="margin-top: 10px">{{ contohMetode }} {{ fmtRp(sisa) }} · {{ fmtWaktu(new Date().toISOString()) }}</p>
            <p class="hint">Pratinjau hasil lunas; tombol Bayar masih merupakan aksi sebelum konfirmasi pada panel utama.</p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="card">
      <h2>Belum ada tagihan final</h2>
      <p class="muted" style="margin: 8px 0 14px">Finalkan tagihan dari worklist terlebih dahulu; pembayaran hanya untuk tagihan berstatus final.</p>
      <NuxtLink to="/kasir" class="btn btn-primary">Buka Worklist Tagihan</NuxtLink>
    </div>
  </div>
</template>
