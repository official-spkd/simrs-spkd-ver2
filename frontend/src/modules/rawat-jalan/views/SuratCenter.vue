<script setup>
/** RJ-08 · Rawat jalan — Surat Center */
import { computed, reactive, ref, watch } from 'vue'
import { Printer } from 'lucide-vue-next'
import { PageHeader, UiBadge, UiButton, UiCard, FormField } from '@/components/ui'
import { formatTanggal } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import { templateSurat, suratAwal, opsiPoli } from '../data-b'
import tandaTangan from '@/assets/img/rawat-jalan/tanda-tangan.svg'

const jenis = ref('Kontrol')
const form = reactive({ ...suratAwal })
const error = ref('')
const ditandatangani = ref(true)

const tpl = computed(() => templateSurat[jenis.value])
const tanggal = computed(() => (form.tanggal ? formatTanggal(form.tanggal) : '—'))

// Label isian tanggal per jenis surat
const labelTanggal = { Kontrol: 'Tanggal kontrol', Sakit: 'Istirahat sampai', Rujukan: 'Tanggal rujukan', Sehat: 'Berlaku sampai' }
const labelPoli = { Kontrol: 'Poli tujuan', Sakit: 'Poli pemeriksa', Rujukan: 'Tujuan rujukan', Sehat: 'Poli pemeriksa' }

/** Isi paragraf surat sesuai jenis. */
const isi = computed(() => {
  const dasar = 'Diagnosis: I50.0 — Congestive heart failure.'
  switch (jenis.value) {
    case 'Sakit':
      return [
        `Yang bertanda tangan di bawah ini menerangkan bahwa pasien Budi Santoso, RM 00-12-34, telah diperiksa di ${form.poli} pada 14 Mei 2025 dan memerlukan istirahat sampai dengan ${tanggal.value}.`,
        `${dasar} Catatan: ${form.catatan || '—'}.`,
        'Surat ini dibuat untuk dipergunakan sebagaimana mestinya.',
      ]
    case 'Rujukan':
      return [
        `Mohon pemeriksaan dan penanganan lebih lanjut untuk pasien Budi Santoso, RM 00-12-34, ke ${form.poli} pada ${tanggal.value}.`,
        `${dasar} Terapi saat ini: furosemid 40 mg 1×1. Catatan: ${form.catatan || '—'}.`,
        'Atas perhatian dan kerja samanya kami ucapkan terima kasih.',
      ]
    case 'Sehat':
      return [
        `Yang bertanda tangan di bawah ini menerangkan bahwa pasien Budi Santoso, RM 00-12-34, telah diperiksa di ${form.poli} pada 14 Mei 2025.`,
        `Hasil pemeriksaan: kondisi umum baik, tanda vital terkontrol. Keterangan berlaku sampai ${tanggal.value}. Catatan: ${form.catatan || '—'}.`,
      ]
    default:
      return [
        `Dengan ini pasien Budi Santoso, RM 00-12-34, dijadwalkan kontrol pada ${tanggal.value} pukul 09.00 WIB di ${form.poli}, dr. Andi, Sp.JP.`,
        `${dasar} Tujuan kontrol: ${form.catatan ? form.catatan.toLowerCase() : 'evaluasi klinis'}, kepatuhan terapi, dan pemeriksaan penunjang.`,
        'Mohon membawa kartu BPJS, surat rujukan, dan hasil pemeriksaan sebelumnya. Bila keluhan memberat, segera datang ke IGD.',
      ]
  }
})

// Perubahan isian/jenis membatalkan tanda tangan sebelumnya
watch([jenis, () => ({ ...form })], () => (ditandatangani.value = false), { deep: true })

function tandaTanganCetak() {
  if (!form.tanggal) {
    error.value = `${labelTanggal[jenis.value]} wajib diisi`
    return
  }
  error.value = ''
  ditandatangani.value = true
  setTimeout(() => window.print(), 50)
}
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner />

    <div class="sc__main">
      <UiCard class="sc__side no-print" title="Template surat">
        <SegTabs v-model="jenis" :tabs="['Kontrol', 'Sakit']" />
        <div><UiButton :class="{ 'is-on': jenis === 'Rujukan' }" @click="jenis = 'Rujukan'">Surat rujukan</UiButton></div>
        <div><UiButton :class="{ 'is-on': jenis === 'Sehat' }" @click="jenis = 'Sehat'">Surat sehat</UiButton></div>

        <FormField :label="labelTanggal[jenis]" required :error="error">
          <input v-model="form.tanggal" type="date" class="input" :class="{ 'input--error': error }" />
        </FormField>
        <FormField :label="labelPoli[jenis]">
          <select v-model="form.poli" class="select">
            <option v-for="p in opsiPoli" :key="p">{{ p }}</option>
          </select>
        </FormField>
        <FormField label="Catatan">
          <input v-model="form.catatan" class="input" />
        </FormField>

        <div><UiButton variant="primary" :icon="Printer" @click="tandaTanganCetak">Tanda tangan &amp; Cetak</UiButton></div>
        <div>
          <UiBadge v-if="ditandatangani" tone="success">DocumentReference · Terkirim</UiBadge>
          <UiBadge v-else tone="warning">Draft · belum ditandatangani</UiBadge>
        </div>
      </UiCard>

      <article class="sc__doc">
        <p class="sc__rs">RUMAH SAKIT SPKD</p>
        <p class="t-xs t-muted t-center">Pelayanan terpadu · Dokumen simulasi / bukan dokumen resmi</p>
        <div class="sc__kop" />
        <p class="sc__judul">{{ tpl.judul }}</p>
        <p class="t-sm">
          Nomor: {{ tpl.nomor }}<br />
          Nama: Budi Santoso · RM 00-12-34 NIK: 32XXXXXXXXXX · IHS P024783755348<br />
          Tanggal: 14 Mei 2025 · {{ form.poli }} · dr. Andi
        </p>
        <div class="sc__isi">
          <p v-for="(p, i) in isi" :key="i">{{ p }}</p>
        </div>
        <div class="sc__sah">
          <p class="t-sm">Dokter penanggung jawab</p>
          <img v-if="ditandatangani" :src="tandaTangan" alt="Tanda tangan ilustratif dr. Andi" class="sc__ttd" />
          <div v-else class="sc__ttd" />
          <p class="t-sm t-strong">dr. Andi, Sp.JP</p>
          <UiBadge v-if="ditandatangani" tone="success">✓ e-Sign BSrE · 14 Mei 2025 09:32 WIB</UiBadge>
        </div>
        <p class="t-xxs t-muted">{{ tpl.loinc }} · DocumentReference · Halaman 1 dari 1</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.sc__main { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.sc__side { width: 300px; flex-shrink: 0; }
.sc__side :deep(.btn.is-on) { border-color: var(--c-primary); color: var(--c-primary); background: var(--c-primary-soft); }
.sc__doc {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
}
.sc__rs { font-size: 16px; font-weight: 600; text-align: center; }
.sc__kop { height: 2px; background: var(--c-primary); width: 100%; }
.sc__judul { font-size: 20px; font-weight: 600; text-align: center; }
.sc__isi { display: flex; flex-direction: column; gap: 19px; font-size: 13px; }
.sc__sah { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; padding-top: 16px; }
.sc__ttd { width: 120px; height: 38px; }
@media (max-width: 1100px) {
  .sc__main { flex-direction: column; }
  .sc__side { width: 100%; }
  .sc__doc { width: 100%; flex: none; }
}
@media print {
  .sc__doc { border: 0; padding: 0; }
}
</style>
