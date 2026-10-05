<script setup>
/** MD-09 · Master data — Terminologi Sync */
import { reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, StatCard, DataTable } from '@/components/ui'
import { sinkronTerminologi } from '../data-a'
import { ringkasanTerminologi, riwayatSinkron, jadwalSinkron } from '../data-b'
import { formatJam, formatTanggal } from '@/utils/format'

const rows = reactive(sinkronTerminologi.map((r) => ({ ...r })))
const stats = reactive(ringkasanTerminologi.map((s) => ({ ...s })))
const riwayat = ref([...riwayatSinkron])
const selected = ref(rows[0].id)
const proses = ref(false)
const pesan = ref('')

const columns = [
  { key: 'valueSet', label: 'Value set', strong: true },
  { key: 'lokal', label: 'Versi lokal' },
  { key: 'remote', label: 'Versi remote' },
  { key: 'terakhir', label: 'Terakhir sinkron' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terkirim' ? 'success' : 'warning') },
]

// Simulasi sinkron manual: tiap value set berstatus Antrian lalu Terkirim.
function sinkronSekarang() {
  proses.value = true
  pesan.value = ''
  rows.forEach((r) => (r.status = 'Antrian'))
  setTimeout(() => {
    const now = new Date()
    const waktu = `${formatTanggal(now)} ${formatJam(now)}`
    rows.forEach((r) => Object.assign(r, { status: 'Terkirim', terakhir: waktu }))
    stats.find((s) => s.key === 'terakhir').value = formatJam(now)
    const tgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(now)
    riwayat.value.unshift(`${tgl} ${formatJam(now)} · Sinkron manual · tidak ada perubahan`)
    proses.value = false
    pesan.value = `5 value set tervalidasi pada ${formatJam(now)} WIB.`
  }, 1200)
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row md-stats">
      <StatCard v-for="s in stats" :key="s.key" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <UiAlert v-if="pesan" tone="success" title="Sinkron selesai" :text="pesan" />

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      selectable
      export-name="terminologi-sync"
    />

    <div class="row md-bawah">
      <UiCard class="grow" title="Riwayat sinkron">
        <ul class="md-riwayat t-body">
          <li v-for="(r, i) in riwayat.slice(0, 4)" :key="i">{{ r }}</li>
        </ul>
        <div><UiBadge tone="success">Seluruh set mutakhir</UiBadge></div>
      </UiCard>
      <UiCard class="grow" title="Jadwal sinkron">
        <p class="t-body">{{ jadwalSinkron }}</p>
        <div>
          <UiButton variant="primary" :disabled="proses" @click="sinkronSekarang">
            {{ proses ? 'Menyinkronkan…' : 'Sinkron Sekarang' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.md-riwayat { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
@media (max-width: 900px) {
  .md-stats,
  .md-bawah { flex-direction: column; }
  .md-stats > :deep(.stat),
  .md-bawah > * { width: 100%; }
}
</style>
