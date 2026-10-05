<script setup>
defineProps({
  items: { type: Array, required: true }, // [{ label, value, tone? }]
  columns: { type: Number, default: 1 },
})
</script>

<template>
  <dl class="kvg" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
    <div v-for="it in items" :key="it.label" class="kvg__item">
      <dt>{{ it.label }}</dt>
      <dd :class="it.tone && `t-${it.tone}`">{{ it.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.kvg { display: grid; gap: 14px 24px; margin: 0; }
.kvg__item { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kvg dt { font-size: 11px; color: var(--c-muted); }
.kvg dd { margin: 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
</style>
