<script setup>
/** IGD-04 · IGD — Tindakan / Resusitasi */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiButton, UiAlert, UiCard, StatCard, FormField, DataTable } from '@/components/ui'
import { formatJam, formatRupiah, useNow } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienAktif, waktuTindakan, timResusitasi, catatanTindakanAwal, billingTindakan } from '../data-a'

const router = useRouter()
const now = useNow()
const waktu = reactive({ ...waktuTindakan })
const tim = reactive(timResusitasi.map((t) => ({ ...t })))
const catatan = ref(catatanTindakanAwal)
const selected = ref(1)
const hasil = ref(null)

const keMenit = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m
}
const durasi = computed(() => {
  const a = keMenit(waktu.mulai)
  const b = keMenit(waktu.selesai)
  return a == null || b == null ? '—' : `${Math.max(b - a, 0)} menit`
})
// Anggota tim = semua butir kecuali konfirmasi akhir (butir terakhir)
const anggota = computed(() => tim.slice(0, -1))
const timHadir = computed(() => `${anggota.value.filter((t) => t.done).length} / ${anggota.value.length}`)

const noteStat = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)
const stats = computed(() => [
  { label: 'Mulai', value: waktu.mulai },
  { label: 'Selesai', value: waktu.selesai },
  { label: 'Durasi', value: durasi.value },
  { label: 'Tim hadir', value: timHadir.value },
])

const columns = [
  { key: 'item', label: 'Waktu / item', strong: true },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'subtotal', label: 'Subtotal', format: (v) => formatRupiah(v) },
]
const total = computed(() => billingTindakan.reduce((s, r) => s + r.subtotal, 0))

function mulai() {
  waktu.mulai = formatJam(new Date())
  waktu.selesai = '—'
  hasil.value = { tone: 'info', title: 'Tindakan dimulai', text: `Mulai ${waktu.mulai} WIB · pencatatan waktu berjalan.` }
}

function selesaikan() {
  if (keMenit(waktu.mulai) == null) {
    hasil.value = { tone: 'warning', title: 'Tindakan belum dimulai', text: 'Tekan "Mulai tindakan" terlebih dahulu.' }
    return
  }
  const akhir = tim[tim.length - 1]
  if (!akhir.done) {
    hasil.value = { tone: 'warning', title: 'Konfirmasi akhir prosedur', text: 'Centang konfirmasi akhir prosedur sebelum menyelesaikan tindakan.' }
    return
  }
  if (keMenit(waktu.selesai) == null) waktu.selesai = formatJam(new Date())
  hasil.value = { tone: 'success', title: 'Tindakan selesai', text: `Selesai ${waktu.selesai} WIB · durasi ${durasi.value}.` }
}

function simpan() {
  if (!catatan.value.trim()) {
    hasil.value = { tone: 'danger', title: 'Catatan tindakan kosong', text: 'Isi catatan tindakan sebelum menyimpan.' }
    return
  }
  hasil.value = { tone: 'success', title: 'Tindakan tersimpan', text: `Billing ${formatRupiah(total.value)} tercatat otomatis · jejak audit diperbarui.` }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <div class="row tindakan-stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="noteStat" />
    </div>

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row tindakan">
      <UiCard class="grow" title="Checklist tim & tindakan">
        <CheckList :items="tim" />
        <FormField label="Catatan tindakan">
          <textarea v-model="catatan" class="textarea" />
        </FormField>
        <div class="row">
          <UiButton @click="mulai">Mulai tindakan</UiButton>
          <UiButton variant="primary" @click="selesaikan">Selesaikan tindakan</UiButton>
        </div>
      </UiCard>

      <UiCard class="tindakan__side" title="Pencatatan otomatis billing">
        <DataTable
          v-model:selected="selected"
          :columns="columns"
          :rows="billingTindakan"
          :searchable="false"
          :exportable="false"
          :filterable="false"
          :paginated="false"
          selectable
        />
        <p class="tindakan__total">Total {{ formatRupiah(total) }}</p>
        <p class="t-sm t-muted">Sumber: TIN-DEMO-021 · obat/alat simulasi, bukan panduan terapi.</p>
      </UiCard>
    </div>

    <div class="row-between">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row gap-8">
        <UiButton @click="router.push('/igd/cppt-igd')">Batal</UiButton>
        <UiButton variant="primary" @click="simpan">Simpan tindakan</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tindakan__side { width: 380px; flex-shrink: 0; }
.tindakan__total { font-size: 20px; font-weight: 600; }
.textarea { min-height: 92px; }
@media (max-width: 1100px) {
  .tindakan-stats { flex-wrap: wrap; }
  .tindakan-stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .tindakan { flex-direction: column; }
  .tindakan__side { width: 100%; }
}
</style>
