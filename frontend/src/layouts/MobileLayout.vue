<script setup>
/** Kerangka aplikasi mobile (ePasien / eDokter) — lebar desain 430px. */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Bell } from 'lucide-vue-next'
import { modulesByKey } from '@/modules/registry'
import { useNow } from '@/utils/format'
import iosSignal from '@/assets/img/ios-signal.svg'
import iosWifi from '@/assets/img/ios-wifi.svg'
import iosBattery from '@/assets/img/ios-battery.svg'

const route = useRoute()
const router = useRouter()
const now = useNow()
const mod = computed(() => modulesByKey[route.meta.module])
const jam = computed(() => `${String(now.value.getHours()).padStart(2, '0')}.${String(now.value.getMinutes()).padStart(2, '0')}`)

function back() {
  if (window.history.length > 1) router.back()
  else router.push(mod.value?.basePath ?? '/')
}
function isActive(t) {
  return route.path === t.to || (t.match && route.path.startsWith(t.match))
}
</script>

<template>
  <div class="m-bg">
    <div class="m-app">
      <!-- Bilah status perangkat: hanya tampil saat pratinjau di layar lebar -->
      <div class="m-status" aria-hidden="true">
        <span>{{ jam }}</span>
        <span class="m-status__icons">
          <img :src="iosSignal" alt="" width="18" height="18" />
          <img :src="iosWifi" alt="" width="18" height="18" />
          <img :src="iosBattery" alt="" width="24" height="24" />
        </span>
      </div>

      <header class="m-head">
        <button class="m-icon" aria-label="Kembali" @click="back"><ChevronLeft /></button>
        <h1 class="m-head__title">{{ route.meta.title }}</h1>
        <button class="m-icon" aria-label="Notifikasi"><Bell /></button>
      </header>

      <main class="m-content">
        <p v-if="route.meta.code" class="t-xs t-muted">{{ route.meta.code }} · SPKD Mobile</p>
        <RouterView />
      </main>

      <nav v-if="mod?.tabs?.length" class="m-tabs" aria-label="Navigasi bawah">
        <RouterLink v-for="t in mod.tabs" :key="t.to" :to="t.to" class="m-tab" :class="{ 'is-active': isActive(t) }">
          <component :is="t.icon" aria-hidden="true" />
          <span>{{ t.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.m-bg { min-height: 100vh; background: #e4eaf2; }
.m-app {
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--c-bg);
  display: flex;
  flex-direction: column;
  position: relative;
}
.m-status {
  height: 44px;
  background: var(--c-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 600;
}
.m-status__icons { display: flex; gap: 5px; align-items: center; }
.m-head {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 64px;
  background: var(--c-surface);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
}
.m-head__title { flex: 1; font-size: 18px; font-weight: 600; }
.m-icon { background: none; border: 0; padding: 0; color: var(--c-primary); display: inline-flex; }
.m-icon svg { width: 20px; height: 20px; }
.m-content { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.m-tabs {
  position: sticky;
  bottom: 0;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  padding: 14px 16px 28px;
}
.m-tab {
  width: 85px;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--c-muted);
}
.m-tab svg { width: 20px; height: 20px; }
.m-tab.is-active { color: var(--c-primary); }

@media (min-width: 520px) {
  .m-app { box-shadow: 0 0 0 1px var(--c-border), var(--shadow-pop); }
}
@media (max-width: 519px) {
  .m-status { display: none; }
  .m-tabs { padding-bottom: calc(14px + env(safe-area-inset-bottom)); }
}
</style>
