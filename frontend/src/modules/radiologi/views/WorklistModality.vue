<script setup>
/** RAD-01 · Radiologi — Worklist Modality */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, StatCard, UiAlert, DataTable } from '@/components/ui'
import SegTabs from './parts-a/SegTabs.vue'
import { statWorklist, tabModality, worklist, toneDicom, toneStatus, infoPacs } from '../data-a'

const router = useRouter()
const tab = ref(tabModality[0])
const terpilih = ref(worklist[0].id)

const columns = [
  { key: 'id', label: 'Antrean / order', strong: true },
  { key: 'pasien', label: 'Pasien / NIK' },
  { key: 'pemeriksaan', label: 'Pemeriksaan' },
  { key: 'modality', label: 'Modality' },
  { key: 'dicom', label: 'DICOM MWL', tone: (r) => toneDicom[r.dicom] },
  { key: 'status', label: 'Status', tone: (r) => toneStatus[r.status] },
]

// Tab perangkat menyaring baris; "Semua perangkat" menampilkan seluruh order
const rows = computed(() =>
  tab.value === 'Semua perangkat' ? worklist : worklist.filter((r) => r.modality === tab.value),
)

// Klik baris → pilih lalu buka proses pemeriksaan untuk order tersebut
function buka(row) {
  terpilih.value = row.id
  router.push({ path: '/radiologi/proses-pemeriksaan', query: { id: row.id } })
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row stats">
      <StatCard v-for="s in statWorklist" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <SegTabs v-model="tab" :tabs="tabModality" />

    <DataTable
      v-model:selected="terpilih"
      :columns="columns"
      :rows="rows"
      selectable
      export-name="worklist-modality"
      @row-click="buka"
    />

    <UiAlert tone="success" :title="infoPacs.title" :text="infoPacs.text" />
  </div>
</template>

<style scoped>
@media (max-width: 1100px) {
  .stats { flex-wrap: wrap; }
  .stats > * { flex: 1 1 calc(50% - 8px); }
}
</style>
