<script setup>
/** RJ-02 · Rawat jalan — Workspace Pasien */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageHeader } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import WorkspaceTabs from './parts-a/WorkspaceTabs.vue'
import VitalCards from './parts-a/VitalCards.vue'
import WorkspaceOverview from './parts-a/WorkspaceOverview.vue'
import { pasienAktif, worklist } from '../data-a'

const route = useRoute()
const router = useRouter()

// Pasien dari worklist (?id=J-xx); default pasien aktif J-07
const pasien = computed(() => {
  const w = worklist.find((r) => r.id === route.query.id)
  if (!w || w.id === 'J-07') return pasienAktif
  return {
    ...pasienAktif,
    nama: w.nama,
    info: w.info,
    antrean: `${w.antrean} · Poli Jantung`,
    alergi: w.alergi === 'Tidak ada' ? 'ALERGI: TIDAK ADA' : `ALERGI: ${w.alergi.toUpperCase()}`,
  }
})
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner :pasien="pasien" />
    <WorkspaceTabs active="Penilaian" />
    <VitalCards />
    <WorkspaceOverview
      @vital-sign="router.push('/rawat-jalan/penilaian-keperawatan')"
      @tambah-order="router.push('/rawat-jalan/order-terpadu')"
      @tutup-kunjungan="router.push('/rawat-jalan/tutup-kunjungan')"
    />
  </div>
</template>
