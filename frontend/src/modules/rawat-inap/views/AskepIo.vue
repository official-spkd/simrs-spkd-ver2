<script setup>
/** RI-04 · Rawat inap — Askep & IO */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, StatCard, FormField, DataTable, BarChart } from '@/components/ui'
import PatientBanner from './parts-b/PatientBanner.vue'
import SegmentTabs from './parts-b/SegmentTabs.vue'
import {
  pasienSari,
  tabAskep,
  infoObstetri,
  ioAwal,
  meowsAwal,
  ambangMeows,
  asuhanAwal,
  observasiAwal,
  petugasShift,
} from '../data-a'

const tab = ref('io')
const io = ref(ioAwal.map((r) => ({ ...r })))
const meows = ref(meowsAwal.map((m) => ({ ...m })))
const asuhan = reactive({ ...asuhanAwal })
const obs = reactive({ ...observasiAwal })
const notice = ref(null)
const selected = ref('07:00')

const fmtBalance = (n) => (n > 0 ? `+${n}` : String(n))
const sum = (k) => io.value.reduce((t, r) => t + r[k], 0)

// Baris tabel IO + baris total
const ioRows = computed(() => {
  const rows = io.value.map((r) => ({ id: r.jam, ...r, balance: fmtBalance(r.oral + r.infus - r.urine) }))
  rows.push({ id: 'total', jam: 'Total', oral: sum('oral'), infus: sum('infus'), urine: sum('urine'), balance: fmtBalance(sum('oral') + sum('infus') - sum('urine')) })
  return rows
})
const ioColumns = [
  { key: 'jam', label: 'Jam', strong: true },
  { key: 'oral', label: 'Oral' },
  { key: 'infus', label: 'Infus' },
  { key: 'urine', label: 'Urine' },
  { key: 'balance', label: 'Balance' },
]

const meowsColumns = [
  { key: 'jam', label: 'Jam', strong: true },
  { key: 'skor', label: 'Skor' },
  { key: 'tindak', label: 'Tindak lanjut', tone: (r) => (r.skor >= ambangMeows ? 'danger' : undefined) },
]
const meowsRows = computed(() =>
  meows.value.map((m) => ({ id: m.label, jam: `${m.label}:00`, skor: m.value, tindak: m.value >= ambangMeows ? 'Eskalasi ke DPJP' : 'Pantau rutin' })),
)

const skorTerakhir = computed(() => meows.value[meows.value.length - 1]?.value ?? 0)
const chartData = computed(() => meows.value.map((m, i) => ({ ...m, highlight: i === meows.value.length - 1 })))

const stats = computed(() => {
  const intake = sum('oral') + sum('infus')
  const output = sum('urine')
  return [
    { label: 'Intake shift pagi', value: `${intake} mL`, note: 'Diperbarui 09:12 WIB' },
    { label: 'Output shift pagi', value: `${output} mL`, note: 'Diperbarui 09:12 WIB' },
    { label: 'Balance cairan', value: `${fmtBalance(intake - output)} mL`, note: 'Diperbarui 09:12 WIB' },
    { label: 'MEOWS terakhir', value: skorTerakhir.value, note: `Ambang eskalasi ≥${ambangMeows}`, noteTone: skorTerakhir.value >= ambangMeows ? 'danger' : 'success' },
  ]
})

const ringkasObs = computed(() => `TD ${obs.td} · Nadi ${obs.nadi} RR ${obs.rr} · Suhu ${obs.suhu} · SpO₂ ${obs.spo2}% ${petugasShift}`)
const statusSkor = computed(() =>
  skorTerakhir.value >= ambangMeows
    ? { tone: 'danger', text: `Skor ${skorTerakhir.value} · eskalasi ke DPJP` }
    : { tone: 'success', text: `Skor ${skorTerakhir.value} · pantau rutin` },
)

// Modal tambah observasi (IO + tanda vital + skor MEOWS)
const obsOpen = ref(false)
const form = reactive({})
const formError = ref('')
function bukaObservasi() {
  const jamAkhir = Number(io.value[io.value.length - 1]?.jam.slice(0, 2) || 9)
  Object.assign(form, { jam: `${String(jamAkhir + 1).padStart(2, '0')}:00`, oral: 0, infus: 0, urine: 0, skor: 1, ...obs })
  formError.value = ''
  obsOpen.value = true
}
function simpanObservasi() {
  if (!/^\d{2}:\d{2}$/.test(form.jam)) {
    formError.value = 'Format jam HH:MM.'
    return
  }
  io.value.push({ jam: form.jam, oral: Number(form.oral) || 0, infus: Number(form.infus) || 0, urine: Number(form.urine) || 0 })
  meows.value.push({ label: form.jam.slice(0, 2), value: Number(form.skor) || 0 })
  if (meows.value.length > 7) meows.value.shift()
  Object.assign(obs, { td: form.td, nadi: form.nadi, rr: form.rr, suhu: form.suhu, spo2: form.spo2 })
  obsOpen.value = false
  notice.value =
    Number(form.skor) >= ambangMeows
      ? { tone: 'danger', title: `MEOWS ${form.skor} · melewati ambang`, text: 'Segera laporkan ke DPJP dan tingkatkan frekuensi pemantauan.' }
      : { tone: 'success', title: `Observasi ${form.jam} tersimpan`, text: 'IO, tanda vital, dan skor MEOWS diperbarui.' }
}

function simpanShift() {
  if (!asuhan.diagnosis.trim()) {
    notice.value = { tone: 'danger', title: 'Diagnosis keperawatan wajib diisi', text: 'Lengkapi asuhan NANDA sebelum menyimpan shift.' }
    return
  }
  notice.value = { tone: 'success', title: 'Shift tersimpan', text: `${petugasShift} · balance ${fmtBalance(sum('oral') + sum('infus') - sum('urine'))} mL` }
}
function batal() {
  Object.assign(asuhan, asuhanAwal)
  notice.value = null
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienSari" />

    <SegmentTabs v-model="tab" :tabs="tabAskep" />

    <UiAlert tone="info" :title="infoObstetri.title" :text="infoObstetri.text" />
    <UiAlert v-if="notice" :tone="notice.tone" :title="notice.title" :text="notice.text" />

    <div class="row io__stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="s.note" :note-tone="s.noteTone || 'success'" />
    </div>

    <div class="row io__main">
      <div class="grow stack">
        <DataTable
          v-if="tab === 'io'"
          v-model:selected="selected"
          title="IO per jam · shift pagi"
          :columns="ioColumns"
          :rows="ioRows"
          :searchable="false"
          :exportable="false"
          :filterable="false"
          :paginated="false"
          selectable
        />
        <DataTable
          v-if="tab === 'meows'"
          title="Skor MEOWS per jam"
          :columns="meowsColumns"
          :rows="meowsRows"
          :searchable="false"
          :exportable="false"
          :filterable="false"
          :paginated="false"
        />

        <UiCard v-if="tab !== 'meows'" title="Asuhan NANDA">
          <FormField label="Diagnosis keperawatan">
            <input v-model="asuhan.diagnosis" class="input" />
          </FormField>
          <FormField label="Intervensi / evaluasi">
            <input v-model="asuhan.intervensi" class="input" />
          </FormField>
        </UiCard>
      </div>

      <div class="io__side stack">
        <UiCard v-if="tab !== 'askep'" :title="`MEOWS · ambang ${ambangMeows}`" subtitle="Sumbu Y: skor · Data simulasi">
          <BarChart :data="chartData" :max="14" />
        </UiCard>
        <UiCard title="Shift & pemantauan">
          <p class="t-body">{{ ringkasObs }}</p>
          <UiBadge :tone="statusSkor.tone" class="io__fit">{{ statusSkor.text }}</UiBadge>
          <UiButton class="io__fit" variant="primary" @click="bukaObservasi">Tambah observasi</UiButton>
        </UiCard>
      </div>
    </div>

    <div class="row-between io__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row-center gap-8">
        <UiButton @click="batal">Batal</UiButton>
        <UiButton variant="primary" @click="simpanShift">Simpan shift</UiButton>
      </div>
    </div>

    <UiModal v-model:open="obsOpen" title="Tambah observasi" subtitle="Sari Wulandari · postpartum hari 1" width="640px">
      <div class="stack">
        <div class="grid-4">
          <FormField label="Jam" required :error="formError"><input v-model="form.jam" class="input" /></FormField>
          <FormField label="Oral (mL)"><input v-model.number="form.oral" class="input" type="number" min="0" /></FormField>
          <FormField label="Infus (mL)"><input v-model.number="form.infus" class="input" type="number" min="0" /></FormField>
          <FormField label="Urine (mL)"><input v-model.number="form.urine" class="input" type="number" min="0" /></FormField>
        </div>
        <div class="grid-3">
          <FormField label="TD"><input v-model="form.td" class="input" /></FormField>
          <FormField label="Nadi"><input v-model="form.nadi" class="input" /></FormField>
          <FormField label="RR"><input v-model="form.rr" class="input" /></FormField>
          <FormField label="Suhu"><input v-model="form.suhu" class="input" /></FormField>
          <FormField label="SpO₂ (%)"><input v-model="form.spo2" class="input" /></FormField>
          <FormField label="Skor MEOWS" :hint="`Eskalasi bila ≥${ambangMeows}`"><input v-model.number="form.skor" class="input" type="number" min="0" /></FormField>
        </div>
      </div>
      <template #footer>
        <UiButton @click="obsOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanObservasi">Simpan observasi</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.io__side { width: 360px; flex-shrink: 0; }
.io__fit { align-self: flex-start; }
@media (max-width: 1100px) {
  .io__stats { flex-wrap: wrap; }
  .io__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .io__main { flex-direction: column; }
  .io__side { width: 100%; }
}
@media (max-width: 640px) {
  .grid-4, .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .io__actions { flex-wrap: wrap; }
}
</style>
