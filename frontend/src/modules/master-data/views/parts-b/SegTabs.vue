<script setup>
/** Tab bergaya "segmen" sesuai desain (bingkai putih, pilihan aktif biru muda). */
const props = defineProps({
  tabs: { type: Array, required: true }, // [{ key, label }] atau ['A','B']
})
const model = defineModel({ type: [String, Number] })
const norm = (t) => (typeof t === 'string' ? { key: t, label: t } : t)
</script>

<template>
  <div class="seg" role="tablist">
    <button
      v-for="t in props.tabs.map(norm)"
      :key="t.key"
      type="button"
      role="tab"
      class="seg__tab"
      :class="{ 'is-active': model === t.key }"
      :aria-selected="model === t.key"
      @click="model = t.key"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  width: 100%;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  overflow-x: auto;
}
.seg__tab {
  background: var(--c-surface);
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--c-muted);
  white-space: nowrap;
}
.seg__tab:hover:not(.is-active) { color: var(--c-text); }
.seg__tab.is-active { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; }
</style>
