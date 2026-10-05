<script setup>
/** RI-02 · Rawat inap — Admisi Ranap */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Printer } from 'lucide-vue-next'
import { PageHeader, UiAlert, UiButton, UiCard, FormField } from '@/components/ui'
import PatientBanner from './parts-b/PatientBanner.vue'
import SegmentTabs from './parts-b/SegmentTabs.vue'
import CheckList from './parts-a/CheckList.vue'
import {
  pasienBudi,
  langkahAdmisi,
  admisiAwal,
  opsiUnit,
  opsiBed,
  opsiDpjp,
  checklistAdmisi,
  depositInfo,
  gelangPasien,
} from '../data-a'

const router = useRouter()
const form = reactive({ ...admisiAwal })
const errors = reactive({})
const checklist = ref(checklistAdmisi.map((c) => ({ ...c })))
const step = ref('persetujuan')
const notice = ref(null)

const cek = (k) => checklist.value.find((c) => c.key === k)?.checked
// Langkah dianggap selesai bila datanya lengkap
const selesai = computed(() => ({
  kamar: !!(form.unit && form.bed),
  sep: !!form.sep.trim(),
  persetujuan: !!cek('persetujuan'),
  gelang: !!cek('gelang'),
}))
const tabs = computed(() =>
  langkahAdmisi.map((l) => ({ key: l.key, label: `${selesai.value[l.key] && l.key !== step.value ? '✓ ' : ''}${l.no} ${l.label}` })),
)

function cetakPersetujuan() {
  checklist.value.find((c) => c.key === 'persetujuan').checked = true
  notice.value = { tone: 'success', title: 'Persetujuan rawat inap dicetak', text: 'Lembar persetujuan siap ditandatangani pasien/keluarga.' }
  step.value = 'gelang'
}
function cetakGelang() {
  checklist.value.find((c) => c.key === 'gelang').checked = true
  notice.value = { tone: 'success', title: 'Gelang identitas dicetak', text: `${gelangPasien.nama} · ${gelangPasien.alergi}` }
}

function validasi() {
  const wajib = { unit: 'Unit / lantai', bed: 'Kamar / bed', dpjp: 'DPJP', sep: 'SEP ranap' }
  Object.keys(errors).forEach((k) => delete errors[k])
  Object.entries(wajib).forEach(([k, label]) => {
    if (!String(form[k]).trim()) errors[k] = `${label} wajib diisi.`
  })
  return !Object.keys(errors).length
}
function simpan() {
  if (!validasi()) {
    notice.value = { tone: 'danger', title: 'Admisi belum lengkap', text: 'Lengkapi isian bertanda * sebelum menyimpan.' }
    return
  }
  if (!cek('gelang')) {
    notice.value = { tone: 'warning', title: 'Admisi tersimpan · gelang belum dicetak', text: 'Cetak gelang identitas sebelum pasien diantar ke ruangan.' }
    return
  }
  notice.value = { tone: 'success', title: 'Admisi tersimpan', text: `${pasienBudi.nama} · ${form.unit} · ${form.bed}` }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienBudi" />

    <SegmentTabs v-model="step" :tabs="tabs" />

    <UiAlert v-if="notice" :tone="notice.tone" :title="notice.title" :text="notice.text" />

    <div class="row adm__main">
      <UiCard class="grow" title="Ringkasan admisi">
        <div class="stack">
          <div class="grid-2">
            <FormField label="Unit / lantai" required :error="errors.unit">
              <select v-model="form.unit" class="select"><option v-for="o in opsiUnit" :key="o">{{ o }}</option></select>
            </FormField>
            <FormField label="Kamar / bed" required :error="errors.bed">
              <select v-model="form.bed" class="select"><option v-for="o in opsiBed" :key="o">{{ o }}</option></select>
            </FormField>
          </div>
          <div class="grid-2">
            <FormField label="DPJP" required :error="errors.dpjp">
              <select v-model="form.dpjp" class="select"><option v-for="o in opsiDpjp" :key="o">{{ o }}</option></select>
            </FormField>
            <FormField label="SEP ranap" required :error="errors.sep">
              <input v-model="form.sep" class="input" :class="{ 'input--error': errors.sep }" />
            </FormField>
          </div>
          <div class="grid-2">
            <FormField label="Tanggal masuk">
              <input v-model="form.masuk" class="input" />
            </FormField>
            <FormField label="Diagnosis masuk">
              <input v-model="form.diagnosis" class="input" />
            </FormField>
          </div>
        </div>
        <CheckList v-model="checklist" />
        <UiButton class="adm__btn" @click="cetakPersetujuan">Cetak persetujuan</UiButton>
      </UiCard>

      <UiCard class="adm__side" title="Deposit & gelang">
        <p class="t-body">{{ depositInfo }}</p>
        <UiAlert tone="success" title="Tanpa deposit tambahan" text="Pembiayaan mengikuti hak kelas BPJS." />
        <div class="card adm__gelang">
          <p class="t-strong">{{ gelangPasien.nama }}</p>
          <p class="t-sm">{{ gelangPasien.identitas }}</p>
          <p class="adm__barcode" aria-label="Barcode gelang">{{ gelangPasien.barcode }}</p>
          <p class="t-xs t-danger">{{ gelangPasien.alergi }}</p>
        </div>
        <UiButton class="adm__btn" variant="primary" :icon="Printer" @click="cetakGelang">Cetak gelang</UiButton>
      </UiCard>
    </div>

    <div class="row-between adm__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row-center gap-8">
        <UiButton @click="router.push('/rawat-inap/bed-board')">Batal</UiButton>
        <UiButton variant="primary" @click="simpan">Simpan admisi</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adm__side { width: 340px; flex-shrink: 0; }
.adm__btn { align-self: flex-start; }
.adm__gelang p { font-size: 14px; }
.adm__gelang .t-sm { font-size: 12px; }
.adm__gelang .t-xs { font-size: 11px; }
.adm__barcode { font-size: 24px !important; letter-spacing: 0; }
@media (max-width: 1100px) {
  .adm__main { flex-direction: column; }
  .adm__side { width: 100%; }
}
@media (max-width: 640px) {
  .grid-2 { grid-template-columns: 1fr; }
  .adm__actions { flex-wrap: wrap; }
}
</style>
