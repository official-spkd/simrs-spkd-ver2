<script setup>
/** Kerangka anjungan mandiri (layar sentuh portrait 1080×1440). */
import { Hospital } from 'lucide-vue-next'
import { useNow, formatJam, formatTanggalPanjang } from '@/utils/format'

const now = useNow(10000)
</script>

<template>
  <div class="kiosk-bg">
    <div class="kiosk">
      <header class="kiosk__head">
        <RouterLink to="/kiosk" class="kiosk__brand">
          <Hospital class="kiosk__logo" aria-hidden="true" />
          <span>SPKD</span>
        </RouterLink>
        <div class="kiosk__clock">
          <p class="kiosk__time">{{ formatJam(now) }} WIB</p>
          <p class="kiosk__date">{{ formatTanggalPanjang(now) }}</p>
        </div>
      </header>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.kiosk-bg { min-height: 100vh; background: var(--c-bg); }
.kiosk {
  max-width: 1080px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 56px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.kiosk__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.kiosk__brand { display: flex; align-items: center; gap: 16px; color: var(--c-text); font-size: 28px; font-weight: 600; }
.kiosk__logo { width: 40px; height: 40px; color: var(--c-primary); stroke-width: 1.5; }
.kiosk__clock { text-align: right; }
.kiosk__time { font-size: 24px; font-weight: 600; }
.kiosk__date { font-size: 16px; color: var(--c-muted); }
@media (max-width: 700px) {
  .kiosk { padding: 24px 16px; gap: 24px; }
}
</style>
