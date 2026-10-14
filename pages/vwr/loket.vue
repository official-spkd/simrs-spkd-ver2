<script setup lang="ts">
definePageMeta({ layout: 'tv' })
const { current, next, menunggu } = useVwrLoket()
const { soundOn, supported, speak, enable } = useVwrSound()
const { jam, detik, tanggal } = useKioskClock()

const flash = ref(false)
let ft: any
const kedip = () => {
  flash.value = false
  clearTimeout(ft)
  setTimeout(() => (flash.value = true), 30)
  ft = setTimeout(() => (flash.value = false), 3400)
}
const { latest } = useVwrCalls(['loket'], (e, live) => {
  if (live) {
    kedip()
    speak(teksPanggil(e))
  }
})
// Replay saat halaman baru dimuat: tampilkan kedip; suara diputar begitu "Aktifkan suara" ditekan.
onMounted(() => kedip())
const aktifkan = () => enable(teksPanggil(latest()))
onBeforeUnmount(() => clearTimeout(ft))

const running = computed(
  () => `Selamat datang di RS SPKD. Silakan ambil nomor antrean di mesin APM atau loket pendaftaran. Siapkan KTP atau kartu BPJS Anda. Saat ini ${menunggu.value.length} antrean menunggu. Jagalah kebersihan dan gunakan masker bila batuk atau pilek.`,
)
const waktuTunggu = (t: any) => fmtJam(t.jam)
</script>
<template>
  <div class="tv">
    <div class="tv-top">
      <b>RS SPKD · Antrean Pendaftaran</b>
      <span>{{ tanggal }} · <b>{{ jam }}</b><small>.{{ detik }}</small></span>
    </div>
    <div class="tv-main">
      <div class="tv-call" :class="{ flash }" aria-live="assertive">
        <template v-if="current">
          <small>Sedang dipanggil</small>
          <div class="no">{{ current.nomor }}</div>
          <div class="to">→ Loket {{ current.loket }}</div>
        </template>
        <template v-else>
          <small>Antrean pendaftaran</small>
          <div class="to">Belum ada panggilan</div>
        </template>
      </div>
      <div class="tv-next">
        <h2>Antrean berikutnya</h2>
        <ul>
          <li v-for="t in next" :key="t.id" class="nx"><span>{{ t.nomor }}</span><small>{{ waktuTunggu(t) }}</small></li>
          <li v-if="!next.length" class="nx empty">Tidak ada antrean menunggu</li>
        </ul>
        <p class="sisa">Total menunggu: <b>{{ menunggu.length }}</b></p>
      </div>
    </div>
    <div class="tv-run"><span>{{ running }}</span></div>
    <button v-if="supported && !soundOn" class="btn btn-primary btn-lg tv-sound" @click="aktifkan">Aktifkan suara</button>
    <span v-else-if="soundOn" class="badge b-ok tv-sound">Suara aktif</span>
  </div>
</template>
<style scoped>
.nx { display: flex; justify-content: space-between; align-items: baseline; }
.nx small { font-size: 22px; font-weight: 500; opacity: .6; }
.nx.empty { font-size: 24px; font-weight: 500; opacity: .7; }
.sisa { margin-top: 16px; font-size: 24px; opacity: .8; }
.tv-sound { z-index: 5; }
.tv-top b { font-weight: 700; }
.tv-top small { opacity: .6; font-size: .6em; }
@media (max-width: 767px) {
  .tv { padding: 16px; font-size: 16px; gap: 14px; }
  .tv-top { font-size: 16px; flex-direction: column; align-items: flex-start; gap: 4px; }
  .tv-next li { font-size: 28px; }
  .tv-call small { font-size: 18px; }
}
</style>
