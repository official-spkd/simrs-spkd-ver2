<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { deviceOk, device } = apm
const { jam, detik, tanggal } = useKioskClock()
onMounted(() => apm.reset())
const mulai = () => {
  if (!deviceOk.value) return
  navigateTo('/apm/menu')
}
</script>
<template>
  <div class="idle" :class="{ off: !deviceOk }" role="button" tabindex="0" @pointerdown.prevent="mulai" @keydown.enter="mulai" @keydown.space.prevent="mulai">
    <div class="idle-in">
      <div class="logo" aria-hidden="true">S</div>
      <h1>RS SPKD</h1>
      <p class="sub">Pendaftaran Mandiri · Rawat Jalan</p>
      <div class="clock"><b>{{ jam }}</b><span>.{{ detik }}</span></div>
      <p class="date">{{ tanggal }}</p>
      <template v-if="deviceOk">
        <div class="cta">Sentuh layar untuk mulai</div>
        <p class="hint">Siapkan KTP atau kartu BPJS Anda</p>
      </template>
      <div v-else class="warn">
        <b>Perangkat belum terdaftar</b>
        <span>Hubungi IT (IT-07) untuk mendaftarkan perangkat ini.</span>
      </div>
    </div>
    <div class="foot">{{ device?.nama || 'APM' }} · Data demo</div>
  </div>
</template>
<style scoped>
.idle { position: relative; min-height: 100vh; background: linear-gradient(160deg, var(--navy) 0%, var(--navy-2) 60%, var(--teal) 140%); color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 24px; cursor: pointer; touch-action: manipulation; }
.idle.off { cursor: default; }
.idle-in { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.logo { width: 110px; height: 110px; border-radius: 26px; background: #fff; color: var(--teal); font-size: 72px; font-weight: 800; display: grid; place-items: center; margin-bottom: 10px; }
h1 { color: #fff; font-size: 56px; margin: 0; letter-spacing: 2px; }
.sub { font-size: 24px; opacity: .85; }
.clock { margin-top: 28px; font-size: clamp(64px, 12vw, 140px); font-weight: 700; line-height: 1; }
.clock span { font-size: .4em; opacity: .7; }
.date { font-size: 26px; opacity: .85; margin-bottom: 36px; }
.cta { background: #fff; color: var(--navy); font-size: 32px; font-weight: 700; padding: 22px 48px; border-radius: 60px; animation: pulse 2s ease-in-out infinite; }
.hint { font-size: 20px; opacity: .75; margin-top: 14px; }
.warn { background: var(--err-bg); color: var(--err); border-radius: 14px; padding: 20px 32px; font-size: 22px; display: flex; flex-direction: column; gap: 6px; max-width: 560px; }
.warn b { font-size: 28px; }
.foot { position: absolute; bottom: 14px; font-size: 15px; opacity: .6; }
@keyframes pulse { 50% { transform: scale(1.04); } }
@media (max-width: 767px) {
  h1 { font-size: 40px; } .sub { font-size: 18px; } .date { font-size: 18px; } .cta { font-size: 24px; padding: 18px 32px; }
  .logo { width: 84px; height: 84px; font-size: 54px; }
}
</style>
