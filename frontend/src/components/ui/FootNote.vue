<script setup>
import { useNow, formatJam } from '@/utils/format'
const now = useNow()
</script>

<template>
  <p class="t-xxs t-muted">Data fiktif · Hak akses sesuai peran · Koneksi aman · Diperbarui {{ formatJam(now) }} WIB</p>
</template>
