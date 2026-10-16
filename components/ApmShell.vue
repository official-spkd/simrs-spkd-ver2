<script setup lang="ts">
// Kerangka halaman APM (Figma APM-02..08): header (logo, judul, kode·langkah, jam), isi, tombol Kembali/Panggil petugas, footer; memasang timer idle 90 detik.
import logoIkon from '~/assets/images/apm/logo-ikon.png'
const props = withDefaults(defineProps<{ kode: string; langkah: string; idle?: boolean; back?: string | (() => void) | false; bantuanInline?: boolean }>(), { idle: true, back: '/apm/menu', bantuanInline: false })
const apm = useApm()
const { device, deviceOk } = apm
const toast = useToast()
const { left } = useApmIdle(props.idle)
const { jam, now } = useKioskClock()
const tgl = computed(() => fmtTgl(now.value.toISOString()))
onMounted(() => {
  if (props.idle && !deviceOk.value) navigateTo('/apm')
})
const kembali = () => (typeof props.back === 'function' ? props.back() : props.back && navigateTo(props.back))
const panggil = () => {
  try {
    apm.callStaff()
    toast.ok('Petugas telah dipanggil. Mohon tunggu di tempat.')
  } catch (e: any) {
    toast.warn(e.message)
  }
}
</script>
<template>
  <div class="apm-shell">
    <header class="apm-top">
      <img :src="logoIkon" alt="SIMRS SPKD" class="apm-logo" width="73" height="72">
      <div class="apm-id">
        <b>RS SPKD · Pendaftaran Mandiri</b>
        <small>{{ kode }} · {{ langkah }}</small>
      </div>
      <div class="apm-clock">{{ jam }} · {{ tgl }}</div>
    </header>
    <div v-if="idle && left <= 15" class="apm-idle" role="status">Layar akan kembali ke awal dalam {{ left }} detik. Sentuh layar untuk melanjutkan.</div>
    <main class="apm-body">
      <slot />
      <div v-if="back !== false" class="apm-row">
        <button type="button" class="apm-btn" @click="kembali">‹ Kembali</button>
        <button type="button" class="apm-btn" @click="panggil">Panggil petugas</button>
        <p v-if="bantuanInline" class="apm-inline-note">Bantuan ekstensi 101 · Panggilan petugas dibatasi 1 kali setiap 60 detik.</p>
      </div>
      <p class="apm-note">Privasi Anda terlindungi · Layar kembali ke awal setelah 90 detik tanpa aktivitas.</p>
      <p class="apm-note"><span class="dot" :class="{ on: device?.online }" /> {{ device?.nama || 'APM' }} {{ deviceOk ? 'terdaftar' : 'belum terdaftar' }} &amp; {{ device?.online ? 'online' : 'offline' }} · Data demo fiktif · Bantuan ekstensi 101</p>
    </main>
  </div>
</template>
<style scoped>
.apm-shell { display: flex; flex-direction: column; min-height: 100vh; background: #f3f6f8; }
.apm-top { background: #fff; display: flex; gap: 24px; align-items: center; padding: 24px 48px; }
.apm-logo { width: 73px; height: 72px; object-fit: contain; flex: none; }
.apm-id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; line-height: 1.45; }
.apm-id b { font-size: 24px; font-weight: 600; color: #06345d; }
.apm-id small { font-size: 20px; color: #647887; }
.apm-clock { font-size: 24px; color: #06345d; white-space: nowrap; }
.apm-idle { background: var(--warn-bg); color: var(--warn); text-align: center; padding: 10px 16px; font-size: 18px; font-weight: 600; }
.apm-body { display: flex; flex-direction: column; gap: 28px; padding: 32px 64px; width: 100%; }
.apm-inline-note { flex: 1; min-width: 240px; font-size: 18px; color: #647887; margin: 0; align-self: center; padding-left: 12px; }
.dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #647887; vertical-align: middle; }
.dot.on { background: #647887; }
@media (max-width: 767px) {
  .apm-top { padding: 14px 16px; gap: 12px; }
  .apm-logo { width: 48px; height: 48px; }
  .apm-id { gap: 4px; } .apm-id b { font-size: 18px; } .apm-id small { font-size: 15px; }
  .apm-clock { font-size: 16px; }
  .apm-body { padding: 20px 16px; gap: 20px; }
}
</style>
