<script setup>
/**
 * Grafik batang sederhana sesuai desain ("Kunjungan per jam").
 * data: [{ label, value, highlight? }]
 */
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  height: { type: Number, default: 180 },
  max: { type: Number, default: 0 },
  color: { type: String, default: 'var(--c-primary-soft)' },
  highlightColor: { type: String, default: 'var(--c-primary)' },
  format: { type: Function, default: (v) => v },
})

const peak = computed(() => props.max || Math.max(1, ...props.data.map((d) => d.value)))
// Batang setinggi maksimal 75% area agar label nilai & sumbu tetap muat.
const barH = (v) => `${(v / peak.value) * (props.height * 0.75 - 40)}px`
</script>

<template>
  <div class="bars" :style="{ height: `${height}px` }" role="img" :aria-label="data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')">
    <div v-for="d in data" :key="d.label" class="bars__col">
      <span class="bars__val">{{ format(d.value) }}</span>
      <span class="bars__bar" :style="{ height: barH(d.value), background: d.highlight ? highlightColor : color }" />
      <span class="bars__lbl">{{ d.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.bars { display: flex; align-items: flex-end; gap: 18px; padding-top: 12px; width: 100%; }
.bars__col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.bars__val { font-size: 11px; color: var(--c-muted); }
.bars__bar { width: 100%; border-radius: 4px 4px 0 0; min-height: 2px; }
.bars__lbl { font-size: 10px; color: var(--c-muted); text-align: center; }
</style>
