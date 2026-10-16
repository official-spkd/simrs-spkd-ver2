<script setup lang="ts">
// APM-01 Layar awal / idle
import logoPutih from '~/assets/images/apm/logo-putih.png'
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { deviceOk, device } = apm
const { jam, tanggal } = useKioskClock()
onMounted(() => apm.reset())
const mulai = () => { if (deviceOk.value) navigateTo('/apm/menu') }
const checkin = () => { if (deviceOk.value) navigateTo('/apm/checkin') }
</script>
<template>
  <div class="idle" :class="{ off: !deviceOk }" role="button" tabindex="0" @click="mulai" @keydown.enter="mulai" @keydown.space.prevent="mulai">
    <img :src="logoPutih" alt="SIMRS SPKD" class="logo" width="266" height="107">
    <p class="t36">RS SPKD · Pendaftaran Mandiri</p>
    <p class="clock">{{ jam }}</p>
    <p class="date">{{ tanggal }}</p>
    <template v-if="deviceOk">
      <p class="t48">Selamat datang</p>
      <p class="t28">Sentuh layar untuk mulai</p>
      <button type="button" class="start" @click.stop="mulai">Mulai pendaftaran →</button>
      <button type="button" class="jkn" @click.stop="checkin">Pasien Mobile JKN / Online Silakan Check-in di Sini</button>
    </template>
    <div v-else class="warn">
      <b>Perangkat belum terdaftar</b>
      <span>Hubungi IT (IT-07) untuk mendaftarkan perangkat ini.</span>
    </div>
    <p class="t20">Data Anda hanya digunakan untuk pelayanan rumah sakit.</p>
    <p class="t20">● {{ device?.nama || 'APM' }} · {{ device?.online ? 'Online' : 'Offline' }} &amp; {{ deviceOk ? 'terdaftar' : 'belum terdaftar' }} · IT-07 · Data demo fiktif</p>
    <p class="t20">Sesi kembali ke awal setelah 90 detik tanpa aktivitas · Bantuan petugas tersedia</p>
  </div>
</template>
<style scoped>
.idle { min-height: 100vh; background: #06345d; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px; padding: 64px; text-align: center; cursor: pointer; touch-action: manipulation; }
.idle.off { cursor: default; }
.idle p { margin: 0; }
.logo { width: 266px; height: 107px; object-fit: contain; }
.t36 { font-size: 36px; font-weight: 600; }
.clock { font-size: 88px; font-weight: 600; line-height: 1; }
.date { font-size: 28px; color: #afcad8; }
.t48 { font-size: 48px; font-weight: 600; }
.t28 { font-size: 28px; }
.start { width: 100%; min-height: 116px; border: 0; border-radius: 16px; background: #008d96; color: #fff; font: inherit; font-size: 32px; font-weight: 600; cursor: pointer; }
.jkn { background: none; border: 0; color: #fff; font: inherit; font-size: 28px; font-weight: 600; cursor: pointer; padding: 0; }
.t20 { font-size: 20px; color: #afcad8; }
.warn { background: var(--err-bg); color: var(--err); border-radius: 14px; padding: 20px 32px; font-size: 22px; display: flex; flex-direction: column; gap: 6px; max-width: 560px; }
.warn b { font-size: 28px; }
@media (max-width: 767px) {
  .idle { padding: 32px 16px; gap: 18px; }
  .logo { width: 200px; height: 80px; }
  .t36 { font-size: 24px; } .clock { font-size: 64px; } .date, .t28, .jkn { font-size: 20px; } .t48 { font-size: 32px; }
  .start { min-height: 80px; font-size: 24px; } .t20 { font-size: 15px; }
}
</style>
