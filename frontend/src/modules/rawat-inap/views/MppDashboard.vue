<script setup>
/** RI-07 · Rawat inap — MPP Dashboard */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, StatCard, DataTable } from '@/components/ui'
import SegmentTabs from './parts-b/SegmentTabs.vue'
import { unitMpp, pasienMpp, ringkasanMpp, prioritasHandover } from '../data-b'

const router = useRouter()
const unit = ref('Melati')
const selected = ref(1)

const rows = computed(() => (unit.value === 'Semua' ? pasienMpp : pasienMpp.filter((p) => p.unit === unit.value)))

// Pasien Budi (contoh utama) membuka workspace ranap
function onRow(row) {
  if (row.id === 1) router.push('/rawat-inap/workspace-ranap')
}

const statusTone = { 'Kritis · ICU': 'danger' }
const handoverTone = { Menunggu: 'warning' }
const columns = [
  { key: 'pasien', label: 'Pasien / RM', strong: true },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'hari', label: 'Hari rawat' },
  { key: 'dpjp', label: 'DPJP' },
  { key: 'status', label: 'Status', tone: (r) => statusTone[r.status] },
  { key: 'handover', label: 'Handover', tone: (r) => handoverTone[r.handover] },
]
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row mpp__stats">
      <StatCard v-for="s in ringkasanMpp" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <SegmentTabs v-model="unit" :tabs="unitMpp" />

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      selectable
      export-name="mpp-dashboard"
      @row-click="onRow"
    />

    <UiAlert tone="danger" :title="prioritasHandover.title" :text="prioritasHandover.text" />
  </div>
</template>

<style scoped>
@media (max-width: 1100px) {
  .mpp__stats { flex-wrap: wrap; }
  .mpp__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
}
</style>
