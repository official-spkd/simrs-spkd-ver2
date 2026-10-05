<script setup>
/** IGD-03 · IGD — CPPT IGD */
import { reactive, ref } from 'vue'
import { PageHeader, UiButton, UiBadge, UiAlert, UiCard, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import { pasienAktif, soapAwal, orderPrioritas } from '../data-a'

const soap = reactive({ ...soapAwal })
const errors = reactive({})
const hasil = ref(null)
const ditandatangani = ref(false)

const label = { s: 'S', o: 'O', a: 'A · ICD-10', p: 'P' }

function validasi() {
  Object.keys(errors).forEach((k) => delete errors[k])
  for (const k of Object.keys(label)) if (!soap[k].trim()) errors[k] = `${label[k]} wajib diisi.`
  return Object.keys(errors).length === 0
}

function simpanDraft() {
  hasil.value = { tone: 'info', title: 'Draft tersimpan', text: `CPPT disimpan sebagai draft pukul ${formatJam(new Date())} WIB.` }
}

function tandaTangan() {
  if (!validasi()) {
    hasil.value = { tone: 'danger', title: 'SOAP belum lengkap', text: 'Lengkapi semua isian bertanda * sebelum tanda tangan.' }
    return
  }
  ditandatangani.value = true
  hasil.value = { tone: 'success', title: 'CPPT ditandatangani', text: `Ditandatangani dr. Andi pukul ${formatJam(new Date())} WIB · tercatat dalam jejak audit.` }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <div class="row aksi-cepat">
      <UiButton variant="primary" size="lg" to="/igd/tindakan-resusitasi">Tindakan</UiButton>
      <UiButton variant="danger" size="lg" to="/igd/tindakan-resusitasi">Resusitasi</UiButton>
      <UiButton size="lg" to="/laboratorium/worklist-laboratorium">Lab CITO</UiButton>
    </div>

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row cppt">
      <UiCard class="grow" title="SOAP cepat">
        <FormField label="S" required :error="errors.s">
          <input v-model="soap.s" class="input" :readonly="ditandatangani" />
        </FormField>
        <FormField label="O" required :error="errors.o">
          <input v-model="soap.o" class="input" :readonly="ditandatangani" />
        </FormField>
        <FormField label="A · ICD-10" required :error="errors.a">
          <input v-model="soap.a" class="input" :readonly="ditandatangani" />
        </FormField>
        <FormField label="P" required :error="errors.p">
          <textarea v-model="soap.p" class="textarea" :readonly="ditandatangani" />
        </FormField>
        <div class="row-between">
          <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
          <div class="row gap-8">
            <UiButton :disabled="ditandatangani" @click="simpanDraft">Simpan draft</UiButton>
            <UiButton variant="primary" :disabled="ditandatangani" @click="tandaTangan">
              {{ ditandatangani ? 'Sudah ditandatangani' : 'Tanda tangan' }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiCard class="cppt__side" title="Order prioritas">
        <UiBadge tone="danger" class="self-start">{{ orderPrioritas.prioritas }}</UiBadge>
        <p class="cppt__order">{{ orderPrioritas.detail }}</p>
        <UiBadge tone="success" class="self-start">{{ orderPrioritas.status }}</UiBadge>
        <UiAlert tone="danger" :title="orderPrioritas.kritis.title" :text="orderPrioritas.kritis.text" />
        <UiButton class="self-start" to="/laboratorium/validasi-nilai-kritis">Buka hasil</UiButton>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.cppt__side { width: 320px; flex-shrink: 0; }
.cppt__order { font-size: 14px; }
.self-start { align-self: flex-start; }
.textarea { min-height: 92px; }
@media (max-width: 1100px) {
  .cppt { flex-direction: column; }
  .cppt__side { width: 100%; }
  .aksi-cepat { flex-wrap: wrap; }
}
</style>
