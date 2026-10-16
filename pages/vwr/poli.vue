<script setup lang="ts">
// VWR-02 Display antrean poli — kolom per poli: nomor dipanggil + ruang + dokter, satu nomor berikutnya. Sumber event: KL-01.
definePageMeta({ layout: 'tv' })
const route = useRoute()
const { db, doctor } = useDb()
const gabung = computed(() => route.query.gabung === '1' || route.query.gabung === 'true')
const { soundOn, supported, speak, enable } = useVwrSound()
// gabung=1: VWR-01 & VWR-02 satu layar — strip & suara panggilan loket dari server
const { current, err: errLoket } = useVwrLoket((e, live) => { if (gabung.value && live) speak(teksPanggil(e)) })

const AKTIF = ['dipanggil', 'vital selesai', 'dilayani']
const kolom = computed(() =>
  db.polis.filter((p: any) => p.aktif).map((p: any) => {
    const vs = db.visits.filter((v: any) => v.poliId === p.id && v.tanggal === todayStr() && v.status !== 'dibatalkan')
    const e = db.queueLog.find((x: any) => x.type === 'poli' && x.poliId === p.id && (x.aksi === 'panggil' || x.aksi === 'panggil ulang'))
    let aktif = e ? vs.find((v: any) => v.antreanPoli.nomor === e.nomor && AKTIF.includes(v.antreanPoli.status)) : null
    if (!aktif) aktif = [...vs].filter((v: any) => AKTIF.includes(v.antreanPoli.status)).sort((a: any, b: any) => ((b.jamPanggil || '') > (a.jamPanggil || '') ? 1 : -1))[0]
    const berikut = vs.filter((v: any) => v.antreanPoli.status === 'menunggu').sort((a: any, b: any) => (a.jamDaftar > b.jamDaftar ? 1 : -1))[0]
    return { ...p, aktif, dokter: aktif ? doctor(aktif.doctorId)?.nama : '', berikut: berikut?.antreanPoli.nomor || '' }
  }),
)

// pembaruan terakhir: data lokal reaktif, dicatat setiap kali kolom berubah
const diperbarui = ref(new Date().toISOString())
watch(kolom, () => (diperbarui.value = new Date().toISOString()), { deep: true })

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
</script>
<template>
  <VwrFrame kode="VWR-02" judul="Antrean Poliklinik · Rawat Jalan" :terhubung="!gabung || !errLoket" :diperbarui="diperbarui" :sound-on="soundOn" :supported="supported" @suara="aktifkan">
    <div v-if="gabung" class="strip">
      <span class="lbl">Loket · sedang dipanggil</span>
      <b>{{ current ? `${current.nomor} → ${current.loketNama}` : '-' }}</b>
    </div>
    <div class="cols">
      <section v-for="k in kolom" :key="k.id" class="col" :class="{ hot: flashId === k.id }" aria-live="polite">
        <h2>{{ k.nama }}</h2>
        <div class="isi">
          <p class="lbl">Sedang dipanggil</p>
          <p class="no" :class="{ kosong: !k.aktif }">{{ k.aktif ? k.aktif.antreanPoli.nomor : '-' }}</p>
          <p class="ruang">{{ k.ruang }}</p>
          <p class="dok">{{ k.aktif ? k.dokter : 'Belum ada panggilan' }}</p>
          <div class="nx">
            <p class="nl">Berikutnya</p>
            <p class="nn" :class="{ kosong: !k.berikut }">{{ k.berikut || 'Tidak ada antrean' }}</p>
          </div>
        </div>
      </section>
    </div>
  </VwrFrame>
</template>
<style scoped>
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.col { background: #fff; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; min-height: 676px; }
.col.hot h2 { animation: hot 1s ease 3; }
@keyframes hot { 50% { background: #14b8c0; } }
.col h2 { background: #008d96; color: #fff; margin: 0; padding: 24px; font-size: 32px; font-weight: 600; line-height: 1.45; }
.isi { padding: 28px; display: flex; flex-direction: column; gap: 28px; }
.isi p { margin: 0; line-height: 1.45; }
.lbl { font-size: 24px; color: #647887; }
.no { font-size: 76px; font-weight: 700; color: #06345d; line-height: 1 !important; white-space: nowrap; }
.no.kosong { color: #afcad8; }
.ruang { font-size: 32px; font-weight: 600; color: #06345d; }
.dok { font-size: 26px; color: #173348; }
.nx { background: #eaf6f5; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.nl { font-size: 24px; color: #00747c; }
.nn { font-size: 44px; font-weight: 600; color: #06345d; }
.nn.kosong { font-size: 26px; font-weight: 400; color: #647887; }
.strip { display: flex; gap: 24px; align-items: center; background: #124465; border-radius: 16px; padding: 18px 24px; flex-wrap: wrap; }
.strip .lbl { color: #afcad8; }
.strip b { font-size: 40px; }
@media (max-width: 767px) {
  .col { min-height: 0; } .col h2 { font-size: 22px; padding: 14px 18px; } .isi { padding: 18px; gap: 12px; }
  .lbl, .nl { font-size: 16px; } .no { font-size: 52px; } .ruang { font-size: 22px; } .dok { font-size: 18px; } .nn { font-size: 30px; }
}
</style>
