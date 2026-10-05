<script setup>
/** Baris 4 panel tanda vital (TD, Nadi, SpO₂, Suhu). */
import { StatCard } from '@/components/ui'
import { tandaVital } from '../../data-a'

defineProps({
  items: { type: Array, default: () => tandaVital },
})
</script>

<template>
  <div class="vitals">
    <StatCard v-for="v in items" :key="v.label" :label="v.label" :value="v.value" :note="v.note" />
  </div>
</template>

<style scoped>
.vitals { display: flex; gap: 16px; width: 100%; }
@media (max-width: 1100px) {
  .vitals { flex-wrap: wrap; }
  .vitals > :deep(.stat) { flex-basis: calc(50% - 8px); }
}
</style>
