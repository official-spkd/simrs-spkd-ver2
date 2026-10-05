<script setup>
/** MD-02 · Master data — Daftar Pasien */
import { ref } from 'vue'
import { PageHeader, UiAlert, UiButton, StatCard, DataTable } from '@/components/ui'
import { ringkasanPasien, pasien } from '../data-a'

const selected = ref(pasien[0].id)

const ihsTone = { 'Antrian IHS': 'warning' }
const columns = [
  { key: 'rm', label: 'RM', strong: true },
  { key: 'nik', label: 'NIK' },
  { key: 'nama', label: 'Nama pasien' },
  { key: 'ihs', label: 'Identitas IHS', tone: (r) => ihsTone[r.ihs] },
  { key: 'alergi', label: 'Alergi', tone: (r) => (r.alergiKritis ? 'danger' : null) },
  { key: 'aksi', label: 'Aksi', sortable: false },
]
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" to="/pendaftaran/form-pasien-baru">+ Baru</UiButton>
    </PageHeader>

    <div class="row md-stats">
      <StatCard v-for="s in ringkasanPasien" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="pasien"
      selectable
      export-name="daftar-pasien"
    >
      <template #cell-aksi="{ row }">
        <RouterLink class="md-link" :to="{ path: '/master-data/detail-pasien', query: { id: row.id } }" @click.stop>
          Detail →
        </RouterLink>
      </template>
    </DataTable>

    <UiAlert
      tone="info"
      title="Identifikasi dimulai dari NIK"
      text="Gunakan NIK, RM, atau nama. Semua identitas dalam desain ini adalah data fiktif."
    />
  </div>
</template>

<style scoped>
.md-link { color: var(--c-text); }
.md-link:hover { color: var(--c-primary); }
@media (max-width: 900px) {
  .md-stats { flex-wrap: wrap; }
  .md-stats > :deep(.stat) { flex-basis: 100%; }
}
</style>
