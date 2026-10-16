<script setup lang="ts">
// KS-03 Pembayaran: Tunai / QRIS / VA (gateway simulasi) / Multi-payment. Data & pembayaran lewat /api/v1/cashier/bills/{visit_id}.
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
const totals = computed(() => bill.value?.totals || { total: 0, diskon: 0, net: 0, penjamin: 0, pasien: 0, selisih: 0, bayar: 0, sisa: 0 })
const lunas = computed(() => bill.value?.status === 'lunas')
const sisa = computed(() => totals.value.sisa)
onMounted(() => { try { localStorage.setItem(KS_AKTIF_KEY, id.value) } catch {} })

const TABS = [{ key: 'Tunai', label: 'Tunai' }, { key: 'QRIS', label: 'QRIS · Simulasi' }, { key: 'VA', label: 'VA · Simulasi' }, { key: 'Multi', label: 'Multi-payment' }]
const metode = ref('Tunai')
const diterima = ref<number>(0)
// multi-payment: sebagian tunai + sisanya lewat gateway (QRIS/VA)
const multiTunai = ref<number>(0)
const multiGateway = ref<'QRIS' | 'VA'>('QRIS')

// gateway simulasi
const QR_DETIK = 10
const qr = reactive({ at: 0, payAt: 0, paid: false })
const va = reactive({ paid: false })
const resetGateway = () => { Object.assign(qr, { at: 0, payAt: 0, paid: false }); va.paid = false }
watch(metode, () => { resetGateway(); diterima.value = 0; multiTunai.value = 0 })
watch(multiGateway, resetGateway)

const gatewayMetode = computed(() => (metode.value === 'Multi' ? multiGateway.value : metode.value === 'Tunai' ? '' : metode.value))
const gatewayJumlah = computed(() => (metode.value === 'Multi' ? Math.max(0, sisa.value - (Number(multiTunai.value) || 0)) : metode.value === 'Tunai' ? 0 : sisa.value))
const tunaiJumlah = computed(() => (metode.value === 'Tunai' ? sisa.value : metode.value === 'Multi' ? Math.min(sisa.value, Number(multiTunai.value) || 0) : 0))
const kembalian = computed(() => Math.max(0, (Number(diterima.value) || 0) - tunaiJumlah.value))
const kurangTunai = computed(() => tunaiJumlah.value > 0 && (Number(diterima.value) || 0) < tunaiJumlah.value)
const gatewayLunas = computed(() => gatewayJumlah.value === 0 || (gatewayMetode.value === 'QRIS' ? qr.paid : gatewayMetode.value === 'VA' ? va.paid : true))
const bisaBayar = computed(() => sisa.value > 0 && !kurangTunai.value && gatewayLunas.value && (metode.value !== 'Multi' || (tunaiJumlah.value > 0 && gatewayJumlah.value > 0)))

const now = ref(Date.now())
let t1: any
onMounted(() => {
  t1 = setInterval(() => {
    now.value = Date.now()
    // polling status gateway (simulasi): QR dianggap dibayar setelah QR_DETIK detik
    if (qr.at && !qr.paid && Date.now() >= qr.payAt) { qr.paid = true; toast.ok(`QRIS ${fmtRp(gatewayJumlah.value)} diterima (simulasi)`) }
  }, 1000)
})
onBeforeUnmount(() => clearInterval(t1))
const sisaDetik = computed(() => (qr.payAt ? Math.max(0, Math.ceil((qr.payAt - now.value) / 1000)) : 0))

const bisaGateway = (m: 'QRIS' | 'VA') => gatewayMetode.value === m && gatewayJumlah.value > 0 && !lunas.value
const buatQr = () => { if (!bisaGateway('QRIS')) return; Object.assign(qr, { at: Date.now(), payAt: Date.now() + QR_DETIK * 1000, paid: false }); toast.info('QR simulasi dibuat — menunggu konfirmasi gateway') }
const batalQr = () => { Object.assign(qr, { at: 0, payAt: 0, paid: false }); toast.warn('QR dibatalkan') }
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const vaNo = computed(() => `DEMO-VA-${String(hash(bill.value?.noInv || id.value) % 1000000).padStart(6, '0')}`)
const bayarVa = () => { if (!bisaGateway('VA')) return; va.paid = true; toast.ok(`VA ${fmtRp(gatewayJumlah.value)} diterima (simulasi)`) }
const statusGateway = computed(() => {
  if (!gatewayMetode.value) return ''
  if (gatewayMetode.value === 'QRIS') return qr.paid ? 'QRIS dibayar · terkonfirmasi gateway' : qr.at ? `Menunggu pembayaran QRIS · konfirmasi simulasi ${sisaDetik.value} dtk` : 'Buat QR simulasi di panel gateway'
  return va.paid ? 'VA dibayar · terkonfirmasi gateway' : `Menunggu transfer ke ${vaNo.value} · gunakan "Simulasi bayar VA"`
})

const memproses = ref(false)
const kirim = async (parts: any[], okMsg: string) => {
  memproses.value = true
  try {
    const r = await aksiKasir(() => kasirApi.bayar(id.value, parts), okMsg)
    if (r) data.value = r
  } finally {
    memproses.value = false
  }
}
const bayar = () => {
  if (!bisaBayar.value) return toast.err(kurangTunai.value ? 'Uang diterima kurang dari porsi tunai' : 'Pembayaran belum lengkap')
  const parts: any[] = []
  if (tunaiJumlah.value > 0) parts.push({ metode: 'Tunai', jumlah: tunaiJumlah.value, diterima: Number(diterima.value) })
  if (gatewayJumlah.value > 0) parts.push({ metode: gatewayMetode.value, jumlah: gatewayJumlah.value, ref: gatewayMetode.value === 'VA' ? vaNo.value : 'QR-' + bill.value.noInv })
  return kirim(parts, kembalian.value > 0 ? `Pembayaran lunas. Kembalian ${fmtRp(kembalian.value)}` : 'Pembayaran lunas · nomor KW terbit')
}
const selesaikanTanpaBayar = () => kirim([], 'Kunjungan lunas tanpa pembayaran pasien')
const bayarTerakhir = computed(() => bill.value?.payments || [])
</script>

<template>
  <div v-if="v && pt && bill">
    <PageHead code="KS-03" role="Kasir" title="Pembayaran" :subtitle="`${bill.noInv || 'Belum ada INV'} · ${bill.status === 'draf' ? 'Tagihan belum final' : lunas ? 'Tagihan lunas' : 'Tagihan final'} · Skema ${labelSkema(bill.skema)}`" />
    <PatientBanner :patient="pt" :visit="v" />

    <div v-if="bill.status === 'draf'" class="guide warn">Tagihan belum difinalkan.&nbsp;<NuxtLink :to="'/kasir/' + id">Finalkan dahulu di Detail Tagihan</NuxtLink>.</div>

    <div v-else class="kl-cols" style="grid-template-columns: minmax(0, 1fr) 370px">
      <div class="kl-col">
        <div v-if="lunas" class="panel">
          <h2>Sisa tagihan</h2>
          <p style="font-size: 54px; font-weight: 600; color: var(--navy); line-height: 1.2">{{ fmtRp(0) }}</p>
          <p class="muted" style="font-size: 14px">Total {{ fmtRp(totals.pasien) }} · Terbayar {{ fmtRp(totals.bayar) }} · <span class="badge b-ok">Lunas</span></p>
          <div class="kl-actions">
            <NuxtLink :to="'/kasir/' + id + '/invoice'" class="btn btn-primary">Cetak invoice &amp; kwitansi</NuxtLink>
            <NuxtLink to="/kasir" class="btn">Kembali ke worklist</NuxtLink>
          </div>
        </div>

        <div v-else-if="totals.pasien === 0" class="panel">
          <h2>Tidak ada pembayaran pasien</h2>
          <p class="muted">Porsi pasien Rp0 ({{ labelSkema(bill.skema) }}). Konfirmasi untuk menyelesaikan kunjungan; nomor KW tetap diterbitkan.</p>
          <div><button class="btn btn-primary" :disabled="memproses" @click="selesaikanTanpaBayar">Selesaikan tanpa pembayaran pasien</button></div>
        </div>

        <div v-else class="panel">
          <h2>Sisa tagihan</h2>
          <p style="font-size: 54px; font-weight: 600; color: var(--navy); line-height: 1.2">{{ fmtRp(sisa) }}</p>
          <p class="muted" style="font-size: 14px">Total {{ fmtRp(totals.pasien) }} · Terbayar {{ fmtRp(totals.bayar) }} · Menunggu pembayaran</p>
          <AppTabs v-model="metode" :tabs="TABS" style="margin: 0" />

          <template v-if="metode === 'Multi'">
            <div class="form-grid">
              <div class="field"><label class="req" for="mt">Porsi tunai (Rp)</label><input id="mt" v-model.number="multiTunai" class="input" type="number" min="0" :max="sisa" inputmode="numeric"></div>
              <div class="field"><label for="mg">Sisa lewat gateway</label>
                <select id="mg" v-model="multiGateway" class="select"><option value="QRIS">QRIS · simulasi</option><option value="VA">VA · simulasi</option></select>
                <span class="hint">{{ fmtRp(gatewayJumlah) }} dibayar lewat {{ multiGateway }}</span>
              </div>
            </div>
          </template>

          <template v-if="metode === 'Tunai' || metode === 'Multi'">
            <div class="field"><label class="req" for="dt">Uang diterima</label><input id="dt" v-model.number="diterima" class="input" type="number" min="0" inputmode="numeric" :placeholder="'Minimal ' + fmtRp(tunaiJumlah)"></div>
            <div class="kl-actions" style="gap: 8px">
              <button class="btn btn-sm" @click="diterima = tunaiJumlah">Uang pas</button>
              <button v-for="n in [50000, 100000, 200000, 300000]" :key="n" class="btn btn-sm" @click="diterima = n">{{ fmtRp(n) }}</button>
            </div>
            <div class="table-wrap">
              <table class="tbl">
                <thead><tr><th>Perhitungan tunai</th><th>Nominal</th></tr></thead>
                <tbody>
                  <tr><td>Tagihan pasien{{ metode === 'Multi' ? ' · porsi tunai' : '' }}</td><td style="color: var(--teal-d)">{{ fmtRp(tunaiJumlah) }}</td></tr>
                  <tr><td>Uang diterima</td><td style="color: var(--teal-d)">{{ fmtRp(Number(diterima) || 0) }}</td></tr>
                  <tr><td>Kembalian otomatis</td><td :style="kurangTunai ? 'color: var(--err)' : 'color: var(--teal-d)'">{{ kurangTunai ? 'Kurang ' + fmtRp(tunaiJumlah - (Number(diterima) || 0)) : fmtRp(kembalian) }}</td></tr>
                </tbody>
              </table>
            </div>
          </template>

          <div v-if="gatewayMetode" class="guide" :class="{ warn: !gatewayLunas }">{{ statusGateway }}</div>

          <div class="kl-actions">
            <button class="btn btn-primary" :disabled="!bisaBayar || memproses" @click="bayar">{{ memproses ? 'Memproses…' : 'Bayar' }}</button>
            <button class="btn" disabled title="Tersedia setelah lunas">Cetak</button>
          </div>
          <div class="guide"><AppIcon name="info" :size="18" /> Server menghitung ulang sisa tagihan saat Bayar. Setelah lunas, kunjungan berubah selesai → lunas dan nomor KW diterbitkan.</div>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Gateway alternatif · simulasi</h2>
          <div><span class="badge b-warn">QRIS / VA · STUB MVP</span></div>
          <h3>QRIS · bukan QR produksi</h3>
          <p class="muted">Tidak ada QR yang dapat dipindai pada demo ini. Transaksi simulasi menunggu konfirmasi; status diperiksa berkala.</p>
          <div class="kl-actions">
            <button class="btn" :disabled="!bisaGateway('QRIS') || (!!qr.at && !qr.paid) || qr.paid" @click="buatQr">Buat QR simulasi</button>
            <button class="btn" :disabled="!qr.at || qr.paid" @click="batalQr">Batalkan QR</button>
          </div>
          <div class="field"><label for="va">Virtual Account · demo</label><input id="va" :value="vaNo" class="input" readonly></div>
          <div><button class="btn" :disabled="!bisaGateway('VA') || va.paid" @click="bayarVa">Simulasi bayar VA</button></div>
          <p class="hint" style="margin: 0">{{ gatewayMetode ? `Nominal gateway: ${fmtRp(gatewayJumlah)} (${gatewayMetode}).` : 'Pilih tab QRIS, VA, atau Multi-payment untuk memakai gateway.' }} Multi-payment dapat menggabungkan nominal tunai dan gateway simulasi.</p>
        </div>
        <div class="panel">
          <h2>Setelah pembayaran berhasil</h2>
          <template v-if="lunas">
            <div><span class="badge b-ok">Lunas</span></div>
            <h3 style="font-size: 14px">{{ bill.noKw }}</h3>
            <p v-for="p in bayarTerakhir" :key="p.id">{{ p.metode }} {{ fmtRp(p.jumlah) }}<template v-if="p.kembalian"> · kembalian {{ fmtRp(p.kembalian) }}</template> · {{ fmtTgl(p.at) }}, {{ fmtJam(p.at) }}</p>
            <p class="hint" style="margin: 0">Kasir: {{ bayarTerakhir[0]?.kasir }}. Cetak ulang tercatat audit.</p>
          </template>
          <template v-else>
            <div><span class="badge b-mute">Belum lunas</span></div>
            <p>Nomor kwitansi (KW) diterbitkan otomatis setelah Bayar, lalu invoice &amp; kwitansi siap dicetak.</p>
          </template>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="card"><p class="muted">Memuat tagihan…</p></div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><p v-if="galat" class="muted">{{ galat }}</p><NuxtLink :to="'/kasir/' + id" class="btn">Kembali</NuxtLink></div>
</template>
