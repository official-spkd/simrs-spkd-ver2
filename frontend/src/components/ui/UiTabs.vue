<script setup>
const props = defineProps({
  tabs: { type: Array, required: true }, // [{ key, label, count? }] atau ['A','B']
})
const model = defineModel({ type: [String, Number] })
const norm = (t) => (typeof t === 'string' ? { key: t, label: t } : t)
</script>

<template>
  <div class="tabs" role="tablist">
    <button
      v-for="t in props.tabs.map(norm)"
      :key="t.key"
      role="tab"
      class="tabs__tab"
      :class="{ 'is-active': model === t.key }"
      :aria-selected="model === t.key"
      @click="model = t.key"
    >
      {{ t.label }}
      <span v-if="t.count != null" class="tabs__count">{{ t.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--c-border); width: 100%; overflow-x: auto; }
.tabs__tab {
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--c-muted);
  white-space: nowrap;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-bottom: -1px;
}
.tabs__tab.is-active { color: var(--c-primary); border-bottom-color: var(--c-primary); font-weight: 600; }
.tabs__count { font-size: 11px; background: var(--c-bg); border-radius: var(--r-pill); padding: 0 7px; }
.tabs__tab.is-active .tabs__count { background: var(--c-primary-soft); }
</style>
