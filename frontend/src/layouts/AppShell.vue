<script setup>
/** Kerangka desktop: Header SIMRS + Navigasi peran (sidebar) + Area kerja. */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, Menu } from 'lucide-vue-next'
import AppHeader from './parts/AppHeader.vue'
import WorkspaceSwitcher from './parts/WorkspaceSwitcher.vue'
import { modulesByKey } from '@/modules/registry'
import FootNote from '@/components/ui/FootNote.vue'

const route = useRoute()
const mod = computed(() => modulesByKey[route.meta.module] ?? null)
const switcherOpen = ref(false)
const navOpen = ref(false)

watch(() => route.fullPath, () => {
  switcherOpen.value = false
  navOpen.value = false
})

function isActive(item) {
  return route.path === item.to || (item.match && route.path.startsWith(item.match))
}
</script>

<template>
  <div class="shell">
    <AppHeader :persona="mod?.persona">
      <template #lead>
        <button class="shell__burger" aria-label="Buka menu" @click="navOpen = !navOpen"><Menu /></button>
      </template>
    </AppHeader>

    <div class="shell__body">
      <aside class="shell__nav no-print" :class="{ 'is-open': navOpen }" aria-label="Navigasi peran">
        <p class="t-overline">Ruang kerja</p>
        <div class="shell__switch">
          <button class="shell__module" :aria-expanded="switcherOpen" @click="switcherOpen = !switcherOpen">
            <span>{{ mod?.label ?? 'SIMRS SPKD' }}</span>
            <ChevronDown aria-hidden="true" />
          </button>
          <WorkspaceSwitcher v-if="switcherOpen" :current="mod?.key" @close="switcherOpen = false" />
        </div>

        <nav class="shell__links">
          <RouterLink
            v-for="item in mod?.nav ?? []"
            :key="item.to + item.label"
            :to="item.to"
            class="shell__link"
            :class="{ 'is-active': isActive(item) }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="shell__settings">
          <p>PENGATURAN</p>
          <a href="#" @click.prevent>Panduan &amp; bantuan</a>
          <a href="#" @click.prevent>Pengaturan akun</a>
        </div>
        <p class="t-xxs t-muted">RS SPKD · v1.0.0 · Akses diaudit</p>
      </aside>
      <div v-if="navOpen" class="shell__scrim" @click="navOpen = false" />

      <main class="shell__main">
        <p class="t-xs t-muted shell__crumb no-print">
          <RouterLink to="/beranda">Beranda</RouterLink> / {{ mod?.label }}<template v-if="route.meta.title"> / {{ route.meta.title }}</template>
        </p>
        <RouterView />
        <FootNote />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--c-bg); }
.shell__burger { display: none; background: none; border: 0; padding: 6px; color: var(--c-text); }
.shell__burger svg { width: 22px; height: 22px; }
.shell__body { flex: 1; display: flex; align-items: stretch; }
.shell__nav {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--c-surface);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow-y: auto;
}
.shell__switch { position: relative; }
.shell__module {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border: 0;
  border-radius: var(--r-sm);
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}
.shell__module svg { width: 16px; height: 16px; flex-shrink: 0; }
.shell__links { display: flex; flex-direction: column; }
.shell__link { font-size: 12px; line-height: 44px; color: var(--c-muted); border-radius: var(--r-sm); }
.shell__link:hover { color: var(--c-text); }
.shell__link.is-active { color: var(--c-primary); font-weight: 600; }
.shell__settings { display: flex; flex-direction: column; font-size: 12px; line-height: 32px; color: var(--c-muted); }
.shell__settings a { color: var(--c-muted); }
.shell__settings a:hover { color: var(--c-text); }
.shell__main { flex: 1; min-width: 0; padding: 28px; display: flex; flex-direction: column; gap: 20px; }
.shell__crumb a { color: var(--c-muted); }
.shell__crumb a:hover { color: var(--c-primary); }
.shell__scrim { display: none; }

@media (max-width: 1100px) {
  .shell__burger { display: inline-flex; }
  .shell__nav {
    position: fixed;
    top: var(--header-h);
    left: 0;
    bottom: 0;
    height: auto;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.2s;
    box-shadow: var(--shadow-pop);
  }
  .shell__nav.is-open { transform: none; }
  .shell__scrim { display: block; position: fixed; inset: var(--header-h) 0 0 0; background: rgba(16, 45, 80, 0.3); z-index: 30; }
  .shell__main { padding: 20px 16px; }
}
@media print {
  .shell__main { padding: 0; }
}
</style>
