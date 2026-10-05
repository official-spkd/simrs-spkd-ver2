<script setup>
/** IGD-02 · IGD — Form Triase */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiButton, UiBadge, UiAlert, UiCard, FormField } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienAktif, triaseAwal, opsiKesadaran, tingkatPrioritas, checklistTriase } from '../data-a'

const router = useRouter()
const sistem = ref('ATS')
const form = reactive({ ...triaseAwal })
const checklist = reactive(checklistTriase.map((c) => ({ ...c })))
const errors = reactive({})
const hasil = ref(null) // { tone, title, text }

const angka = (v) => Number(String(v).replace(',', '.').match(/[\d.]+/)?.[0] ?? NaN)

// Penentuan prioritas sederhana dari tanda vital (simulasi, ditinjau petugas)
const prioritas = computed(() => {
  const sis = angka(form.td)
  const nadi = angka(form.nadi)
  const rr = angka(form.rr)
  const spo2 = angka(form.spo2)
  const sadarBerat = ['Sopor', 'Koma'].includes(form.kesadaran)
  if (sis < 90 && nadi > 120) return { level: 'Merah', title: 'Gangguan sirkulasi', text: `TD sistolik <90 dan nadi ${nadi}/menit. Dasar triase ditinjau petugas.` }
  if (sis < 90 || spo2 < 90 || sadarBerat) return { level: 'Merah', title: 'Kondisi mengancam jiwa', text: 'Tanda vital kritis. Dasar triase ditinjau petugas.' }
  if (nadi > 100 || rr > 24 || spo2 < 95 || sis < 100) return { level: 'Kuning', title: 'Tanda vital abnormal', text: 'Perlu penilaian dokter dalam 30 menit. Dasar triase ditinjau petugas.' }
  return { level: 'Hijau', title: 'Tanda vital stabil', text: 'Tidak ada tanda kegawatan. Dasar triase ditinjau petugas.' }
})
const tingkat = computed(() => tingkatPrioritas[prioritas.value.level])
const labelPrioritas = computed(() => `${prioritas.value.level.toUpperCase()} · ${tingkat.value[sistem.value]}`)
const varianTombol = computed(() => ({ Merah: 'danger', Kuning: 'primary', Hijau: 'success' })[prioritas.value.level])

const wajib = { keluhan: 'Keluhan utama', kesadaran: 'Kesadaran', td: 'TD', nadi: 'Nadi', rr: 'RR', spo2: 'SpO₂', dasar: 'Dasar penentuan prioritas' }

function validasi() {
  Object.keys(errors).forEach((k) => delete errors[k])
  for (const [k, label] of Object.entries(wajib)) if (!String(form[k]).trim()) errors[k] = `${label} wajib diisi.`
  return Object.keys(errors).length === 0
}

function simpan() {
  if (!validasi()) {
    hasil.value = { tone: 'danger', title: 'Triase belum lengkap', text: 'Lengkapi isian bertanda * sebelum menyimpan.' }
    return
  }
  const belum = checklist.filter((c) => !c.done).map((c) => c.label)
  if (belum.length) {
    hasil.value = { tone: 'warning', title: 'Checklist belum lengkap', text: `Belum dicentang: ${belum.join(', ')}.` }
    return
  }
  hasil.value = {
    tone: 'success',
    title: `Triase ${prioritas.value.level.toLowerCase()} tersimpan`,
    text: `${pasienAktif.nama} · ${labelPrioritas.value} · tercatat dalam jejak audit.`,
  }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <SegTabs v-model="sistem" :tabs="['PTT', 'ATS']" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row triase">
      <UiCard class="grow" title="Penilaian triase">
        <div class="grid-2">
          <FormField label="Keluhan utama" required :error="errors.keluhan">
            <input v-model="form.keluhan" class="input" />
          </FormField>
          <FormField label="Kesadaran" required :error="errors.kesadaran">
            <select v-model="form.kesadaran" class="select">
              <option v-for="o in opsiKesadaran" :key="o">{{ o }}</option>
            </select>
          </FormField>
          <FormField label="TD" required :error="errors.td">
            <input v-model="form.td" class="input" />
          </FormField>
          <FormField label="Nadi" required :error="errors.nadi">
            <input v-model="form.nadi" class="input" />
          </FormField>
          <FormField label="RR" required :error="errors.rr">
            <input v-model="form.rr" class="input" />
          </FormField>
          <FormField label="SpO₂" required :error="errors.spo2">
            <input v-model="form.spo2" class="input" />
          </FormField>
          <FormField label="Suhu">
            <input v-model="form.suhu" class="input" />
          </FormField>
          <FormField label="Waktu datang">
            <input v-model="form.waktuDatang" class="input" />
          </FormField>
        </div>
        <FormField label="Dasar penentuan prioritas" required :error="errors.dasar">
          <textarea v-model="form.dasar" class="textarea" />
        </FormField>
      </UiCard>

      <UiCard class="triase__side" title="Prioritas terpilih">
        <UiBadge :tone="tingkat.tone" class="self-start">{{ labelPrioritas }}</UiBadge>
        <p class="triase__waktu" :class="`t-${tingkat.tone}`">{{ tingkat.waktu }}</p>
        <UiAlert :tone="tingkat.tone" :title="prioritas.title" :text="prioritas.text" />
        <CheckList :items="checklist" />
        <UiButton :variant="varianTombol" class="self-start" @click="simpan">
          Simpan triase {{ prioritas.level.toLowerCase() }}
        </UiButton>
      </UiCard>
    </div>

    <div class="row-between">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row gap-8">
        <UiButton @click="router.push('/igd/tracking-board')">Batal</UiButton>
        <UiButton variant="primary" @click="simpan">Simpan triase</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.triase__side { width: 330px; flex-shrink: 0; }
.triase__waktu { font-size: 36px; font-weight: 600; line-height: 1.45; }
.self-start { align-self: flex-start; }
.textarea { min-height: 92px; }
@media (max-width: 1100px) {
  .triase { flex-direction: column; }
  .triase__side { width: 100%; }
}
@media (max-width: 700px) {
  .grid-2 { grid-template-columns: minmax(0, 1fr); }
}
</style>
