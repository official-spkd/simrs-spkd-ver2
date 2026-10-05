<script setup>
import { UiButton } from '@/components/ui'
</script>

<template>
  <div class="nf">
    <p class="t-overline">404</p>
    <h1 class="t-page-title">Halaman tidak ditemukan</h1>
    <p class="t-muted">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p>
    <UiButton variant="primary" to="/beranda">Kembali ke beranda</UiButton>
  </div>
</template>

<style scoped>
.nf { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; }
</style>
