<script setup>
/** RJ-04 · Rawat jalan — CPPT Editor */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, FormField } from '@/components/ui'
import { useNow, formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import WorkspaceTabs from './parts-a/WorkspaceTabs.vue'
import { riwayatCppt, soapAwal, icd10 } from '../data-a'

const now = useNow()

const soap = reactive({ ...soapAwal })
const diagnosisTambahan = ref([])
const errors = reactive({ s: '', o: '', a: '', p: '' })
const status = ref(null) // { tone, title, text }

const kodeA = computed(() => soap.a.split('·')[0].trim())
const aValid = computed(() => icd10.includes(soap.a.trim()))

function validasi() {
  for (const k of ['s', 'o', 'a', 'p']) errors[k] = soap[k].trim() ? '' : 'Wajib diisi'
  if (!errors.a && !aValid.value) errors.a = 'Pilih kode ICD-10 dari daftar'
  return !Object.values(errors).some(Boolean)
}

function simpanDraft() {
  status.value = { tone: 'info', title: 'Draft tersimpan', text: `Disimpan ${formatJam(now.value)} WIB · belum ditandatangani.` }
}

function tandaTangan() {
  if (!validasi()) {
    status.value = { tone: 'danger', title: 'CPPT belum lengkap', text: 'Lengkapi semua isian SOAP bertanda * sebelum tanda tangan.' }
    return
  }
  status.value = {
    tone: 'success',
    title: 'CPPT ditandatangani',
    text: `dr. Andi · ${formatJam(now.value)} WIB · Composition terkirim ke Satu Sehat.`,
  }
}
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner />
    <WorkspaceTabs active="CPPT" />

    <div class="cp__main">
      <UiCard class="cp__side" title="Riwayat CPPT · baca saja">
        <template v-for="r in riwayatCppt" :key="r.id">
          <div><UiBadge :tone="r.tone">{{ r.label }}</UiBadge></div>
          <p>{{ r.text }}</p>
        </template>
        <div><UiButton to="/rawat-jalan/hasil-penunjang">📎 Lab 12 Mei · Hb 13,1</UiButton></div>
        <UiAlert tone="danger" title="Alergi: PENISILIN" />
      </UiCard>

      <UiCard class="grow" title="SOAP hari ini · 14 Mei 09:12">
        <FormField label="S · Subjektif" required :error="errors.s">
          <textarea v-model="soap.s" class="textarea cp__area" />
        </FormField>

        <FormField label="O · Objektif" required :error="errors.o">
          <input v-model="soap.o" class="input" />
          <span v-if="!errors.o" class="cp__ok">✓ Diimpor dari penilaian Ns. Maya 09:05</span>
        </FormField>

        <FormField label="A · Asesmen / ICD-10" required :error="errors.a">
          <input v-model="soap.a" class="input" list="rj-icd10" />
          <span v-if="!errors.a && aValid" class="cp__ok">Autocomplete: {{ kodeA }} cocok dengan diagnosis dipilih</span>
        </FormField>
        <datalist id="rj-icd10">
          <option v-for="d in icd10" :key="d" :value="d" />
        </datalist>

        <FormField v-for="(d, i) in diagnosisTambahan" :key="i" :label="`Diagnosis tambahan ${i + 1}`">
          <input v-model="diagnosisTambahan[i]" class="input" list="rj-icd10" placeholder="Ketik kode / nama ICD-10" />
        </FormField>
        <div><UiButton @click="diagnosisTambahan.push('')">+ Tambah diagnosis</UiButton></div>

        <FormField label="P · Rencana" required :error="errors.p">
          <textarea v-model="soap.p" class="textarea cp__area" />
        </FormField>

        <div class="cp__btns">
          <UiButton to="/rawat-jalan/order-terpadu">Order</UiButton>
          <UiButton :to="{ path: '/rawat-jalan/order-terpadu', query: { tab: 'Obat' } }">Resep</UiButton>
          <UiButton @click="soap.p += soap.p.endsWith(' ') ? 'Edukasi diberikan.' : ' Edukasi diberikan.'">Edukasi</UiButton>
        </div>

        <UiAlert v-if="status" :tone="status.tone" :title="status.title" :text="status.text" />

        <div class="row-between cp__actions">
          <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
          <div class="cp__acts">
            <UiButton @click="simpanDraft">Simpan Draft</UiButton>
            <UiButton variant="primary" @click="tandaTangan">Tanda Tangan</UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.cp__main { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.cp__side { width: 350px; flex-shrink: 0; }
.cp__area { min-height: 92px; }
.cp__ok { font-size: 11px; color: var(--c-success); }
.cp__btns { display: flex; gap: 16px; flex-wrap: wrap; }
.cp__actions { flex-wrap: wrap; }
.cp__acts { display: flex; gap: 8px; }
@media (max-width: 1100px) {
  .cp__main { flex-direction: column; }
  .cp__side { width: 100%; }
}
</style>
