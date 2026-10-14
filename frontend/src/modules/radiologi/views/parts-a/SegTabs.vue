<script setup>
/** Tab bergaya "pilihan" (kotak putih, tab aktif biru muda) sesuai desain RAD-01, RAD-02, RAD-04 */
defineProps({
  tabs: { type: Array, required: true }, // ['X-Ray 01', 'CT 01']
})
const model = defineModel({ type: String })
</script>

<template>
  <div class="seg" role="tablist">
    <button
      v-for="t in tabs"
      :key="t"
      type="button"
      role="tab"
      class="seg__tab"
      :class="{ 'is-active': model === t }"
      :aria-selected="model === t"
      @click="model = t"
    >
      {{ t }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex; gap: 4px; padding: 4px; width: 100%; overflow-x: auto;
  background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-sm);
}
.seg__tab {
  border: 0; background: var(--c-surface); border-radius: 6px; padding: 10px 14px;
  font-size: 12px; color: var(--c-muted); white-space: nowrap; line-height: var(--lh); cursor: pointer;
}
.seg__tab:hover { background: var(--c-bg); }
.seg__tab.is-active { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; }
</style>
