<script setup>
/** RJ-06 · Rawat jalan — Hasil Penunjang */
import { computed, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, DataTable, KeyValue } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import WorkspaceTabs from './parts-a/WorkspaceTabs.vue'
import TrendChart from './parts-b/TrendChart.vue'
import { orderPasien, trenHb, hasilLab, laporanRadiologi, diagnosticReport } from '../data-b'

const selected = ref(1)
const radiologiOpen = ref(false)

const trenTeks = computed(() => `Hb: ${trenHb.map((t) => String(t.value).replace('.', ',')).join(' → ')} g/dL`)

const statusTone = { Normal: null, Tinggi: 'danger', Rendah: 'warning' }
const columns = [
  { key: 'parameter', label: 'Parameter', strong: true },
  { key: 'hasil', label: 'Hasil' },
  { key: 'satuan', label: 'Satuan' },
  { key: 'rujukan', label: 'Rujukan' },
  { key: 'status', label: 'Status', tone: (r) => statusTone[r.status] },
]

const laporanItems = [
  { label: 'Pemeriksaan', value: laporanRadiologi.judul },
  { label: 'Temuan', value: laporanRadiologi.temuan },
  { label: 'Kesan', value: laporanRadiologi.kesan },
  { label: 'Radiolog', value: laporanRadiologi.radiolog },
]
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner />
    <WorkspaceTabs active="Hasil Penunjang" />

    <div class="hp__main">
      <div class="hp__side">
        <UiCard title="Order pasien">
          <template v-for="o in orderPasien" :key="o.label">
            <div><UiBadge :tone="o.tone">{{ o.label }}</UiBadge></div>
            <p v-if="o.text" class="t-sm">{{ o.text }}</p>
          </template>
          <div><UiButton @click="radiologiOpen = true">Buka laporan radiologi</UiButton></div>
        </UiCard>

        <UiCard title="Tren hemoglobin" :subtitle="trenTeks">
          <TrendChart :data="trenHb" />
        </UiCard>
      </div>

      <DataTable
        v-model:selected="selected"
        class="grow"
        title="Hasil tervalidasi · 14 Mei 2025"
        :columns="columns"
        :rows="hasilLab"
        selectable
        export-name="hasil-tervalidasi"
      />
    </div>

    <UiAlert tone="success" :title="diagnosticReport.title" :text="diagnosticReport.text" />

    <UiModal v-model:open="radiologiOpen" title="Laporan radiologi" subtitle="Budi Santoso · RM 00-12-34 · ImagingStudy" width="640px">
      <KeyValue :items="laporanItems" />
      <UiBadge tone="primary">Siap baca · belum ditandatangani radiolog</UiBadge>
      <template #footer>
        <UiButton @click="radiologiOpen = false">Tutup</UiButton>
        <UiButton variant="primary" to="/radiologi/viewer-radiologi">Buka viewer</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.hp__main { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.hp__side { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 1100px) {
  .hp__main { flex-direction: column; }
  .hp__side { width: 100%; }
}
</style>
