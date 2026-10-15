<script setup lang="ts">
definePageMeta({ layout: 'tv' })
const route = useRoute()
const { db, doctor } = useDb()
const gabung = computed(() => route.query.gabung === '1' || route.query.gabung === 'true')
const { soundOn, supported, speak, enable } = useVwrSound()
// gabung=1: strip & suara panggilan loket dari server (/api/v1/display/queues)
const { current, menunggu } = useVwrLoket((e, live) => { if (gabung.value && live) speak(teksPanggil(e)) })
const { jam, detik, tanggal } = useKioskClock()

const AKTIF = ['dipanggil', 'vital selesai', 'dilayani']
const kolom = computed(() =>
  db.polis.filter((p: any) => p.aktif).map((p: any) => {
    const vs = db.visits.filter((v: any) => v.poliId === p.id && v.tanggal === todayStr() && v.status !== 'dibatalkan')
    const e = db.queueLog.find((x: any) => x.type === 'poli' && x.poliId === p.id && (x.aksi === 'panggil' || x.aksi === 'panggil ulang'))
    let aktif = e ? vs.find((v: any) => v.antreanPoli.nomor === e.nomor && AKTIF.includes(v.antreanPoli.status)) : null
    if (!aktif) aktif = [...vs].filter((v: any) => AKTIF.includes(v.antreanPoli.status)).sort((a: any, b: any) => ((b.jamPanggil || '') > (a.jamPanggil || '') ? 1 : -1))[0]
    const berikut = vs.filter((v: any) => v.antreanPoli.status === 'menunggu').sort((a: any, b: any) => (a.jamDaftar > b.jamDaftar ? 1 : -1))
    return { ...p, aktif, dokter: aktif ? doctor(aktif.doctorId)?.nama : '', berikut: berikut.slice(0, 3).map((v: any) => v.antreanPoli.nomor), jumlah: berikut.length }
  }),
)

const flashId = ref('')
let ft: any
const kedip = (poliId: string) => {
  flashId.value = ''
  clearTimeout(ft)
  setTimeout(() => (flashId.value = poliId), 30)
  ft = setTimeout(() => (flashId.value = ''), 3400)
}
const { latest } = useVwrCalls(['poli'], (e, live) => {
  if (e.type === 'poli') kedip(e.poliId)
  if (live) speak(teksPanggil(e))
})
const aktifkan = () => enable(teksPanggil(latest() || (gabung.value ? current.value : null)))
onBeforeUnmount(() => clearTimeout(ft))
const running = 'Harap menunggu di ruang tunggu sampai nomor Anda dipanggil. Siapkan kartu identitas dan kartu BPJS. Terima kasih atas kesabaran Anda.'
</script>
<template>
  <div class="tv">
    <div class="tv-top">
      <b>RS SPKD · Antrean Poliklinik</b>
      <span>{{ tanggal }} · <b>{{ jam }}</b><small>.{{ detik }}</small></span>
    </div>

    <div v-if="gabung" class="strip">
      <div class="strip-now" :class="{ flash: false }">
        <small>Loket</small>
        <b v-if="current">{{ current.nomor }} → Loket {{ current.loket }}</b>
        <b v-else>-</b>
      </div>
      <div class="strip-next">
        <small>Menunggu di loket</small>
        <span>{{ menunggu }} nomor</span>
      </div>
    </div>

    <div class="tv-poli">
      <div v-for="k in kolom" :key="k.id" class="tv-col" :class="{ hot: flashId === k.id }">
        <h3>{{ k.nama }}</h3>
        <small class="ruang">{{ k.ruang }}</small>
        <template v-if="k.aktif">
          <small class="lbl2">Sedang dipanggil</small>
          <div class="no">{{ k.aktif.antreanPoli.nomor }}</div>
          <div class="dok">{{ k.dokter }}</div>
        </template>
        <template v-else>
          <small class="lbl2">Sedang dipanggil</small>
          <div class="no none">-</div>
          <div class="dok">Belum ada panggilan</div>
        </template>
        <div class="nx">
          <small>Berikutnya</small>
          <div class="nxl">
            <span v-for="n in k.berikut" :key="n">{{ n }}</span>
            <span v-if="!k.berikut.length" class="none">Tidak ada antrean</span>
          </div>
          <small v-if="k.jumlah > 3" class="more">+{{ k.jumlah - 3 }} lainnya</small>
        </div>
      </div>
    </div>

    <div class="tv-run"><span>{{ running }}</span></div>
    <button v-if="supported && !soundOn" class="btn btn-primary btn-lg tv-sound" @click="aktifkan">Aktifkan suara</button>
    <span v-else-if="soundOn" class="badge b-ok tv-sound">Suara aktif</span>
  </div>
</template>
<style scoped>
.tv-top b { font-weight: 700; }
.tv-top small { opacity: .6; font-size: .6em; }
.tv-poli { align-content: start; }
.tv-col { transition: background .3s; }
.tv-col.hot { animation: hot 1s ease 3; }
@keyframes hot { 50% { background: #14b8c0; } }
.ruang { opacity: .7; font-size: 20px; }
.lbl2 { opacity: .75; font-size: 20px; margin-top: 8px; }
.tv-col .no.none { opacity: .35; }
.dok { font-size: 24px; font-weight: 600; min-height: 32px; }
.nx { margin-top: auto; border-top: 1px solid rgba(255, 255, 255, .18); padding-top: 12px; }
.nx small { opacity: .75; font-size: 18px; }
.nxl { display: flex; gap: 14px; flex-wrap: wrap; font-size: 34px; font-weight: 700; margin-top: 4px; }
.nxl .none { font-size: 20px; font-weight: 500; opacity: .6; }
.more { display: block; margin-top: 4px; }
.strip { display: flex; gap: 24px; align-items: center; background: rgba(255, 255, 255, .08); border-radius: 16px; padding: 14px 24px; flex-wrap: wrap; }
.strip small { opacity: .7; margin-right: 8px; font-size: 18px; }
.strip-now b { font-size: 34px; }
.strip-next span { font-size: 30px; font-weight: 700; margin-right: 16px; }
@media (max-width: 767px) {
  .tv { padding: 16px; font-size: 16px; gap: 14px; }
  .tv-top { font-size: 16px; flex-direction: column; align-items: flex-start; gap: 4px; }
  .tv-col .no { font-size: 56px; }
}
</style>
