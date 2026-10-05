<script setup>
/** Tab segmen sesuai desain "Tab" (kotak putih ber-border, pilihan aktif biru muda) */
defineProps({
  tabs: { type: Array, required: true }, // [{ key, label }]
})
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
  display: flex; gap: 4px; padding: 4px; width: 100%; overflow-x: auto;
  background: #fff; border: 1px solid var(--c-border); border-radius: var(--r-sm);
}
.seg__tab {
  background: #fff; border: 0; border-radius: 6px; padding: 10px 14px;
  font: inherit; font-size: 12px; line-height: 1.45; color: var(--c-muted); white-space: nowrap; cursor: pointer;
}
.seg__tab:hover { color: var(--c-text); }
.seg__tab.is-active { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; }
</style>
