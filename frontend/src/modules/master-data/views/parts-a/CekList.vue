<script setup>
/** Daftar centang (☑ / ☐) bergaya desain: 13px, tinggi baris 32px. Item dapat dicentang. */
defineProps({
  items: { type: Array, required: true }, // [{ id, label, done }]
})
</script>

<template>
  <ul class="ceklist">
    <li v-for="it in items" :key="it.id">
      <label class="check ceklist__item">
        <input v-model="it.done" type="checkbox" />
        <span>{{ it.label }}</span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
.ceklist { list-style: none; margin: 0; padding: 0; width: 100%; }
.ceklist__item { min-height: 32px; font-size: 13px; color: var(--c-text); gap: 10px; }
</style>
