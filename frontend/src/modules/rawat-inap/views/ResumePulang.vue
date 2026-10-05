<script setup>
/** RI-06 · Rawat inap — Resume Pulang */
import { reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, FormField } from '@/components/ui'
import PatientBanner from './parts-b/PatientBanner.vue'
import CheckList from './parts-a/CheckList.vue'
import ttdDpjp from '@/assets/img/rawat-inap/tanda-tangan-dpjp.svg'
import { pasienRanap, resumeAwal, kondisiPulangOpsi, checklistResume, dokumenResume } from '../data-b'

const form = reactive({ ...resumeAwal })
const errors = reactive({})
const checklist = ref(checklistResume.map((c) => ({ ...c })))
const esign = ref(dokumenResume.esign)
const notice = ref(null)

function validasi() {
  const wajib = { diagnosis: 'Diagnosis akhir', kondisi: 'Kondisi pulang', kontrol: 'Kontrol' }
  Object.keys(errors).forEach((k) => delete errors[k])
  Object.entries(wajib).forEach(([k, label]) => {
    if (!String(form[k]).trim()) errors[k] = `${label} wajib diisi.`
  })
  if (!/^\d{6}$/.test(form.pin)) errors.pin = 'PIN e-Sign 6 digit.'
  return !Object.keys(errors).length
}

function tandaTangan() {
  if (!validasi()) {
    notice.value = { tone: 'danger', title: 'Resume belum lengkap', text: 'Lengkapi isian bertanda *.' }
    return
  }
  const kurang = checklist.value.filter((c) => !c.checked)
  if (kurang.length) {
    notice.value = { tone: 'warning', title: 'Checklist belum lengkap', text: `Belum: ${kurang.map((c) => c.label).join(', ')}.` }
    return
  }
  const now = new Date()
  const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
  esign.value = `✓ e-Sign BSrE · 14 Mei 2025 ${jam} WIB`
  notice.value = { tone: 'success', title: 'Resume pulang ditandatangani', text: 'Dokumen dikirim sebagai DocumentReference dan siap dicetak.' }
  setTimeout(() => window.print(), 50)
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner class="no-print" :pasien="pasienRanap" />

    <div class="row rp__main">
      <UiCard class="rp__form no-print" title="Finalisasi resume">
        <div class="stack">
          <div class="grid-2">
            <FormField label="Diagnosis akhir" required :error="errors.diagnosis">
              <input v-model="form.diagnosis" class="input" />
            </FormField>
            <FormField label="Masuk / pulang">
              <input v-model="form.periode" class="input" />
            </FormField>
          </div>
          <div class="grid-2">
            <FormField label="Kondisi pulang" required :error="errors.kondisi">
              <select v-model="form.kondisi" class="select">
                <option v-for="o in kondisiPulangOpsi" :key="o">{{ o }}</option>
              </select>
            </FormField>
            <FormField label="Kontrol" required :error="errors.kontrol">
              <input v-model="form.kontrol" class="input" />
            </FormField>
          </div>
        </div>
        <FormField label="Obat / instruksi">
          <textarea v-model="form.obat" class="textarea rp__textarea" />
        </FormField>
        <FormField label="PIN e-Sign" required :error="errors.pin">
          <input v-model="form.pin" class="input" type="password" inputmode="numeric" maxlength="6" autocomplete="off" />
        </FormField>
        <CheckList v-model="checklist" />
        <UiAlert v-if="notice" :tone="notice.tone" :title="notice.title" :text="notice.text" />
        <UiButton class="rp__btn" variant="primary" @click="tandaTangan">Tanda tangan &amp; Cetak</UiButton>
      </UiCard>

      <article class="rp__doc">
        <p class="rp__rs">{{ dokumenResume.rs }}</p>
        <p class="rp__sub">{{ dokumenResume.subRs }}</p>
        <div class="rp__kop" />
        <p class="rp__judul">{{ dokumenResume.judul }}</p>
        <p class="rp__identitas">{{ dokumenResume.identitas }}</p>
        <div class="rp__isi">
          <p>{{ dokumenResume.ringkasan }}</p>
          <p>{{ dokumenResume.terapi }}</p>
          <p>{{ dokumenResume.penutup }}</p>
        </div>
        <div class="rp__sah">
          <p>{{ dokumenResume.ttdLabel }}</p>
          <img :src="ttdDpjp" alt="Tanda tangan DPJP" class="rp__ttd" />
          <p class="t-strong">{{ dokumenResume.dpjp }}</p>
          <UiBadge tone="success">{{ esign }}</UiBadge>
        </div>
        <p class="rp__kaki">{{ dokumenResume.kaki }}</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.rp__form { width: 330px; flex-shrink: 0; }
.rp__btn { align-self: flex-start; }
.rp__textarea { min-height: 92px; }
.rp__doc {
  flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 20px;
  background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 8px; padding: 32px;
}
.rp__rs { font-size: 16px; font-weight: 600; text-align: center; }
.rp__sub { font-size: 11px; color: var(--c-muted); text-align: center; }
.rp__kop { height: 2px; background: var(--c-primary); width: 100%; }
.rp__judul { font-size: 20px; font-weight: 600; text-align: center; }
.rp__identitas { font-size: 12px; }
.rp__isi { display: flex; flex-direction: column; gap: 19px; font-size: 13px; }
.rp__sah { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; padding-top: 16px; font-size: 12px; }
.rp__ttd { width: 120px; height: 38px; }
.rp__kaki { font-size: 10px; color: var(--c-muted); }
@media (max-width: 1100px) {
  .rp__main { flex-direction: column; }
  .rp__form { width: 100%; }
  .rp__doc { width: 100%; }
}
@media (max-width: 640px) {
  .grid-2 { grid-template-columns: 1fr; }
  .rp__doc { padding: 20px; }
}
</style>
