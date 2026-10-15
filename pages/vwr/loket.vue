<script setup lang="ts">
// VWR-01 Layar antrean loket — data publik dari server (/api/v1/display/queues), hanya panggilan hari ini.
definePageMeta({ layout: 'tv' })
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
// Panggilan baru / panggil ulang (last_called_at berubah) → kedip + suara. Muatan pertama hanya kedip.
const { lokets, current, menunggu, err } = useVwrLoket((e, live) => {
  kedip()
  if (live) speak(teksPanggil(e))
})
const aktifkan = () => enable(teksPanggil(current.value))
onBeforeUnmount(() => clearTimeout(ft))

const running = computed(
  () => `Selamat datang di RS SPKD. Silakan ambil nomor antrean di mesin APM atau loket pendaftaran. Siapkan KTP atau kartu BPJS Anda. Saat ini ${menunggu.value} antrean menunggu. Jagalah kebersihan dan gunakan masker bila batuk atau pilek.`,
)
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
          <div class="to">→ {{ current.loketNama }}</div>
        </template>
        <template v-else>
          <small>Antrean pendaftaran</small>
          <div class="to">Belum ada panggilan</div>
        </template>
      </div>
      <div class="tv-next">
        <h2>Loket</h2>
        <ul>
          <li v-for="l in lokets" :key="l.id" class="nx" :class="{ off: !l.aktif }">
            <span>{{ l.nama }}</span><b>{{ !l.aktif ? 'tutup' : l.current ? l.current.nomor : '-' }}</b>
          </li>
          <li v-if="!lokets.length" class="nx empty">{{ err ? 'Menghubungkan ke server…' : 'Belum ada loket' }}</li>
        </ul>
        <p class="sisa">Total menunggu: <b>{{ menunggu }}</b></p>
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
.nx.off { opacity: .45; }
.nx b { font-weight: 700; font-variant-numeric: tabular-nums; }
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
