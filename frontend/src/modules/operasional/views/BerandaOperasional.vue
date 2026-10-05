<script setup>
/** SHL-02 · Operasional — Beranda operasional */
import { computed, ref } from 'vue'
import { PageHeader, UiAlert, UiCard, StatCard, DataTable, BarChart } from '@/components/ui'
import { salam } from '@/utils/format'
import { ringkasan, kunjunganPerJam, notifikasiPrioritas, aktivitas } from '../data'

const greeting = computed(() => `${salam()}, Maya`)
const selected = ref(1)

const statusTone = { Terkirim: 'success', Kritis: 'danger' }
const columns = [
  { key: 'waktu', label: 'Waktu', strong: true },
  { key: 'layanan', label: 'Layanan' },
  { key: 'pasien', label: 'Pasien / identitas' },
  { key: 'petugas', label: 'Petugas' },
  { key: 'status', label: 'Status', tone: (r) => statusTone[r.status] },
]
</script>

<template>
  <div class="page">
    <PageHeader />

    <UiAlert tone="info" :title="greeting" text="Ringkasan layanan hari ini dan prioritas yang memerlukan perhatian tim." />

    <div class="row">
      <StatCard v-for="s in ringkasan" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <div class="row beranda__mid">
      <UiCard class="grow" title="Kunjungan per jam" subtitle="Sumbu Y: pasien · Data simulasi">
        <BarChart :data="kunjunganPerJam" />
      </UiCard>
      <UiCard class="beranda__notif" title="Notifikasi prioritas">
        <RouterLink v-for="n in notifikasiPrioritas" :key="n.title" :to="n.to">
          <UiAlert :tone="n.tone" :title="n.title" :text="n.text" />
        </RouterLink>
      </UiCard>
    </div>

    <DataTable
      v-model:selected="selected"
      title="Aktivitas terakhir"
      :columns="columns"
      :rows="aktivitas"
      selectable
      export-name="aktivitas-terakhir"
    />
  </div>
</template>

<style scoped>
.beranda__notif { width: 370px; flex-shrink: 0; }
@media (max-width: 1100px) {
  .row { flex-wrap: wrap; }
  .row > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .beranda__mid { flex-direction: column; }
  .beranda__notif { width: 100%; }
}
</style>
