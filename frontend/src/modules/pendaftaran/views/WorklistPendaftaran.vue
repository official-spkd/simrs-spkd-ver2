<script setup>
/** PDR-01 · Pendaftaran — Worklist Pendaftaran */
import { useRouter } from 'vue-router'
import { PageHeader } from '@/components/ui'
import WorklistLoket from './parts-a/WorklistLoket.vue'

const router = useRouter()

// Enter pada isian identifikasi → dialog Cari Pasien (PDR-02)
function cari(q) {
  router.push({ path: '/pendaftaran/cari-pasien', query: q ? { q } : {} })
}
</script>

<template>
  <div class="page">
    <PageHeader />
    <WorklistLoket @cari="cari" />
  </div>
</template>
