<script setup>
import { computed } from 'vue'
import { desktopModules, moduleHome } from '@/modules/registry'

defineProps({ current: { type: String, default: '' } })
const emit = defineEmits(['close'])

const groups = computed(() => {
  const map = new Map()
  for (const m of desktopModules) {
    const g = m.group ?? 'Lainnya'
    if (!map.has(g)) map.set(g, [])
    map.get(g).push(m)
  }
  return [...map.entries()]
})
</script>

<template>
  <div class="ws" role="menu">
    <div v-for="[g, items] in groups" :key="g" class="ws__group">
      <p class="t-overline">{{ g }}</p>
      <RouterLink
        v-for="m in items"
        :key="m.key"
        :to="moduleHome(m)"
        class="ws__item"
        :class="{ 'is-current': m.key === current }"
        role="menuitem"
        @click="emit('close')"
      >
        {{ m.label }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.ws {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 260px;
  max-height: 70vh;
  overflow-y: auto;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-pop);
  padding: 12px;
  z-index: 45;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ws__group { display: flex; flex-direction: column; gap: 2px; }
.ws__group .t-overline { padding: 0 8px 4px; }
.ws__item { padding: 8px; border-radius: var(--r-sm); font-size: 13px; color: var(--c-text); }
.ws__item:hover { background: var(--c-bg); }
.ws__item.is-current { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; }
</style>
