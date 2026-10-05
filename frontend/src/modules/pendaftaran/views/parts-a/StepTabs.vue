<script setup>
/** "Tab" bersegmen sesuai desain (kotak putih, pilihan aktif biru muda). tabs: [{ key, label }] */
defineProps({ tabs: { type: Array, required: true } })
const model = defineModel({ type: [String, Number] })
</script>

<template>
  <div class="seg" role="tablist">
    <button
      v-for="t in tabs"
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
  color: var(--c-muted);
  white-space: nowrap;
}
.seg__tab:hover:not(.is-active) { background: var(--c-bg); }
.seg__tab.is-active { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; }
</style>
