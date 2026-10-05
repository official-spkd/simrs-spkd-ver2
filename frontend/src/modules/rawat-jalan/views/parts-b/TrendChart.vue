<script setup>
/** Grafik tren garis sederhana (data → polyline), sesuai panel "Tren hemoglobin". */
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true }, // [{ label, value }]
  height: { type: Number, default: 160 },
})

const W = 300
const top = 20
const bottom = 125

const points = computed(() => {
  const vals = props.data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const n = props.data.length
  return props.data.map((d, i) => ({
    x: 8 + (n > 1 ? (i * (W - 16)) / (n - 1) : (W - 16) / 2),
    y: bottom - ((d.value - min) / span) * (bottom - top),
    ...d,
  }))
})
const line = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '))
</script>

<template>
  <div class="trend">
    <svg :viewBox="`0 0 ${W} 130`" preserveAspectRatio="none" class="trend__svg" role="img" :aria-label="data.map((d) => `${d.label} ${d.value}`).join(', ')">
      <line x1="0" :x2="W" y1="40" y2="40" class="trend__grid" />
      <line x1="0" :x2="W" y1="90" y2="90" class="trend__grid" />
      <polyline :points="line" class="trend__line" />
    </svg>
    <div class="trend__labels">
      <span v-for="d in data" :key="d.label">{{ d.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.trend { display: flex; flex-direction: column; gap: 5px; height: 160px; width: 100%; }
.trend__svg { width: 100%; height: 130px; overflow: visible; }
.trend__grid { stroke: var(--c-border); stroke-width: 1; vector-effect: non-scaling-stroke; }
.trend__line { fill: none; stroke: var(--c-primary); stroke-width: 2; vector-effect: non-scaling-stroke; }
.trend__labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--c-muted); }
</style>
