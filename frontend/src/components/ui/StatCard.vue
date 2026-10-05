<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  note: { type: String, default: '' },
  noteTone: { type: String, default: 'success' }, // success | warning | danger | muted | primary
  icon: { type: [Object, Function], default: null },
})
</script>

<template>
  <div class="card stat">
    <div class="stat__label">
      <component :is="icon" v-if="icon" class="stat__icon" aria-hidden="true" />
      <span>{{ label }}</span>
    </div>
    <p class="stat__value">{{ value }}</p>
    <p v-if="note" class="stat__note" :class="`t-${noteTone}`">{{ note }}</p>
  </div>
</template>

<style scoped>
.stat { flex: 1 1 0; }
.stat__label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--c-muted); }
.stat__icon { width: 16px; height: 16px; }
.stat__value { font-size: 30px; font-weight: 600; line-height: 1.2; }
.stat__note { font-size: 11px; }
</style>
