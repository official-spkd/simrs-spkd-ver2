<script setup>
/** MD-01 · Master data — Beranda Master */
import { ref } from 'vue'
import { PageHeader, UiAlert, UiButton, UiCard, StatCard, DataTable, BarChart } from '@/components/ui'
import CekList from './parts-a/CekList.vue'
import { ringkasanMaster, registrasiMingguIni, kualitasMaster, sinkronTerminologi } from '../data-a'

const kualitas = ref(kualitasMaster.map((k) => ({ ...k })))
const selected = ref(sinkronTerminologi[0].id)

const columns = [
  { key: 'valueSet', label: 'Value set', strong: true },
  { key: 'lokal', label: 'Lokal' },
  { key: 'remote', label: 'Remote' },
  { key: 'terakhir', label: 'Terakhir sinkron' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terkirim' ? 'success' : 'warning') },
]
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row md-stats">
      <StatCard v-for="s in ringkasanMaster" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <div class="row md-mid">
      <UiCard class="grow" title="Registrasi pasien minggu ini" subtitle="Sumbu Y: kunjungan · Data simulasi">
        <BarChart :data="registrasiMingguIni" />
      </UiCard>

      <UiCard class="md-kualitas" title="Kualitas master">
        <UiAlert tone="warning" title="8 nakes belum terpetakan" text="3 dalam proses · 5 perlu registrasi IHS" />
        <CekList :items="kualitas" />
        <div><UiButton to="/master-data/daftar-nakes">Tinjau kualitas data</UiButton></div>
      </UiCard>
    </div>

    <DataTable
      v-model:selected="selected"
      title="Sinkronisasi terminologi"
      :columns="columns"
      :rows="sinkronTerminologi"
      selectable
      export-name="sinkronisasi-terminologi"
      @row-click="$router.push('/master-data/terminologi-sync')"
    />
  </div>
</template>

<style scoped>
.md-kualitas { width: 350px; flex-shrink: 0; }
@media (max-width: 1100px) {
  .md-stats { flex-wrap: wrap; }
  .md-stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .md-mid { flex-direction: column; }
  .md-kualitas { width: 100%; }
}
</style>
