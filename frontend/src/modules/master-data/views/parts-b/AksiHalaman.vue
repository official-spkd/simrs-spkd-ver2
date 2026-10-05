<script setup>
/** Baris "Aksi halaman": catatan audit di kiri, tombol aksi di kanan (slot). */
defineProps({
  note: { type: String, default: 'Perubahan tercatat dalam jejak audit' },
})
</script>

<template>
  <div class="aksi-hal">
    <p class="t-xs t-muted">{{ note }}</p>
    <div class="aksi-hal__btns"><slot /></div>
  </div>
</template>

<style scoped>
.aksi-hal { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; flex-wrap: wrap; }
.aksi-hal__btns { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
