<script setup>
/** Daftar centang (☑/☐ pada desain) — baris 32px, teks 13px. Dipakai RI-02, RI-03, RI-06. */
const items = defineModel({ type: Array, required: true }) // [{ key, label, labelDone?, checked }]
</script>

<template>
  <div class="checklist">
    <label v-for="it in items" :key="it.key" class="check checklist__item">
      <input v-model="it.checked" type="checkbox" />
      <span>{{ it.checked && it.labelDone ? it.labelDone : it.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.checklist { display: flex; flex-direction: column; }
.checklist__item { font-size: 13px; line-height: 32px; min-height: 32px; }
</style>
