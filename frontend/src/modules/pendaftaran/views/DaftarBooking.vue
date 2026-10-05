<script setup>
/** PDR-08 · Pendaftaran — Daftar Booking */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, StatCard, DataTable } from '@/components/ui'
import { formatJam, useNow } from '@/utils/format'
import StepTabs from './parts-a/StepTabs.vue'
import { rekapBooking, tabBooking, daftarBooking } from '../data-b'

const now = useNow()
const rekap = reactive({ ...rekapBooking })
const rows = reactive(daftarBooking.map((b) => ({ ...b })))
const tab = ref('semua')
const selected = ref(1)
const pesan = ref('')

const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)
const stats = computed(() => [
  { label: 'Booking hari ini', value: rekap.total },
  { label: 'Sudah check-in', value: rekap.checkIn },
  { label: 'Menunggu', value: rekap.menunggu },
])

const statusLabel = (r) => ({ hadir: `Hadir · ${r.antrean}`, menunggu: 'Menunggu', batal: 'Dibatalkan' })[r.status]
// Urutan "Hari ini" mengikuti jam booking; status batal hanya tampil di tab Dibatalkan
const tampil = computed(() =>
  rows
    .filter((r) => (tab.value === 'semua' ? r.status !== 'batal' : r.status === tab.value))
    .sort((a, b) => a.waktu.localeCompare(b.waktu))
    .map((r) => ({ ...r, pasien: `${r.nama} / ${r.nik}`, statusText: statusLabel(r) })),
)

const columns = [
  { key: 'waktu', label: 'Waktu', strong: true },
  { key: 'pasien', label: 'Pasien / NIK' },
  { key: 'poli', label: 'Poli' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'statusText', label: 'Status', tone: (r) => (r.status === 'menunggu' ? 'warning' : r.status === 'batal' ? 'danger' : null) },
  { key: 'aksi', label: 'Aksi', sortable: false },
]

// Nomor antrean berikutnya per poli
const nomorTerakhir = reactive({ J: 9, S: 10, M: 4, A: 6, B: 6 })
function checkIn(id) {
  const r = rows.find((x) => x.id === id)
  if (!r || r.status !== 'menunggu') return
  nomorTerakhir[r.prefix] = (nomorTerakhir[r.prefix] ?? 0) + 1
  r.antrean = `${r.prefix}-${String(nomorTerakhir[r.prefix]).padStart(2, '0')}`
  r.status = 'hadir'
  rekap.checkIn++
  rekap.menunggu = Math.max(0, rekap.menunggu - 1)
  selected.value = id
  pesan.value = `${r.nama} check-in · nomor antrean ${r.antrean} (Poli ${r.poli}).`
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="grid-3 bk__stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <StepTabs v-model="tab" :tabs="tabBooking" />

    <UiAlert v-if="pesan" tone="success" :title="pesan">
      <template #actions><UiButton size="sm" variant="ghost" @click="pesan = ''">Tutup</UiButton></template>
    </UiAlert>

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="tampil"
      selectable
      export-name="daftar-booking"
      empty-text="Tidak ada booking pada kategori ini."
    >
      <template #cell-aksi="{ row }">
        <RouterLink
          v-if="row.status === 'hadir'"
          class="bk__link"
          :to="{ path: '/pendaftaran/form-kunjungan', query: row.pasienId ? { id: row.pasienId } : {} }"
          @click.stop
        >
          Detail →
        </RouterLink>
        <button v-else-if="row.status === 'menunggu'" type="button" class="bk__link" @click.stop="checkIn(row.id)">Check-in</button>
        <span v-else class="t-muted">—</span>
      </template>
    </DataTable>

    <UiAlert tone="info" title="Scan QR booking untuk check-in cepat" text="Verifikasi NIK dan IHS sebelum menghasilkan antrean poli." />
  </div>
</template>

<style scoped>
.bk__stats { width: 100%; }
.bk__link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--c-text);
  cursor: pointer;
}
.bk__link:hover { color: var(--c-primary); text-decoration: underline; }
@media (max-width: 720px) {
  .bk__stats { grid-template-columns: 1fr; }
}
</style>
