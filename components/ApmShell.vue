<script setup lang="ts">
// Kerangka halaman APM: header (logo, judul, langkah, jam), isi, footer; memasang timer idle 90 detik.
const props = withDefaults(defineProps<{ kode: string; langkah: string; idle?: boolean }>(), { idle: true })
const { device, deviceOk } = useApm()
const { left } = useApmIdle(props.idle)
const { jam, tanggal } = useKioskClock()
onMounted(() => {
  if (props.idle && !deviceOk.value) navigateTo('/apm')
})
</script>
<template>
  <div class="apm-shell">
    <header class="kiosk-top">
      <div class="apm-brand">
        <span class="apm-logo" aria-hidden="true">S</span>
        <div>
          <b>RS SPKD · Pendaftaran Mandiri</b>
          <small>{{ kode }} · {{ langkah }}</small>
        </div>
      </div>
      <div class="apm-clock">
        <b>{{ jam }}</b>
        <small>{{ tanggal }}</small>
      </div>
    </header>
    <div v-if="idle && left <= 15" class="apm-idle">Layar akan kembali ke awal dalam {{ left }} detik. Sentuh layar untuk melanjutkan.</div>
    <main class="kiosk-body"><slot /></main>
    <footer class="kiosk-foot">
      <span>Data Anda dijaga kerahasiaannya dan hanya dipakai untuk pendaftaran berobat.</span>
      <span>Perangkat: {{ device?.nama || 'belum terdaftar' }}{{ deviceOk ? ' · terdaftar' : '' }}</span>
      <span>Data demo</span>
    </footer>
  </div>
</template>
<style scoped>
.apm-shell { display: flex; flex-direction: column; min-height: 100vh; }
.apm-shell .kiosk-body { display: flex; flex-direction: column; }
.apm-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.apm-logo { width: 52px; height: 52px; border-radius: 12px; background: var(--teal); color: #fff; font-weight: 800; font-size: 30px; display: grid; place-items: center; flex: none; }
.apm-clock { text-align: right; flex: none; }
.apm-clock b { font-size: 30px; line-height: 1; }
.apm-idle { background: var(--warn-bg); color: var(--warn); text-align: center; padding: 10px 16px; font-size: 18px; font-weight: 600; }
@media (max-width: 767px) {
  .apm-logo { width: 40px; height: 40px; font-size: 22px; }
  .apm-clock b { font-size: 22px; }
  .apm-clock small { display: none; }
}
</style>
