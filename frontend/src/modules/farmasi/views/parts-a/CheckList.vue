<script setup>
/** Daftar centang (baris 32px, teks 13px) — dipakai di telaah, komposisi, serah terima */
defineProps({
  items: { type: Array, required: true }, // [{ label, done }] (diubah langsung / reaktif)
})
</script>

<template>
  <ul class="cl">
    <li v-for="it in items" :key="it.label">
      <label class="cl__item">
        <input v-model="it.done" type="checkbox" />
        <span>{{ it.label }}</span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
.cl { list-style: none; margin: 0; padding: 0; width: 100%; }
.cl__item { display: flex; align-items: center; gap: 8px; min-height: 32px; font-size: 13px; cursor: pointer; }
.cl__item input { accent-color: var(--c-muted); width: 14px; height: 14px; margin: 0; flex-shrink: 0; }
</style>
