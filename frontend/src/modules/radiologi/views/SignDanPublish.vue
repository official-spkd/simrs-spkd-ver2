<script setup>
/** RAD-05 · Radiologi — Sign & Publish */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiButton, UiBadge, UiAlert, UiCard, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienAktif, dokumenLaporan, radiolog, checklistFinal, pengiriman } from '../data-a'
import imgTandaTangan from '@/assets/img/radiologi/tanda-tangan-ilustratif.svg'

const pin = ref('')
const checklist = reactive(checklistFinal.map((c) => ({ ...c })))
const errorPin = ref('')
const terbit = ref(false)
const hasil = ref(null)

const lengkap = computed(() => checklist.every((c) => c.done))

function tandaTangan() {
  errorPin.value = /^\d{6}$/.test(pin.value) ? '' : 'PIN e-Sign 6 digit wajib diisi.'
  if (errorPin.value || !lengkap.value) {
    hasil.value = {
      tone: 'danger',
      title: 'Belum dapat diterbitkan',
      text: errorPin.value || 'Centang seluruh checklist finalisasi terlebih dahulu.',
    }
    return
  }
  terbit.value = true
  pin.value = ''
  hasil.value = {
    tone: 'success',
    title: 'Laporan diterbitkan',
    text: `Ditandatangani ${radiolog} pukul ${formatJam(new Date())} WIB · dikirim ke dokter pengirim & Satu Sehat.`,
  }
}

function cetak() {
  window.print()
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row sign">
      <article class="dok grow">
        <p class="dok__rs">{{ dokumenLaporan.rs }}</p>
        <p class="dok__sub">{{ dokumenLaporan.subjudul }}</p>
        <div class="dok__kop" />
        <p class="dok__judul">{{ dokumenLaporan.judul }}</p>
        <p class="dok__identitas">
          <template v-for="(baris, i) in dokumenLaporan.identitas" :key="baris">{{ baris }}<br v-if="i < dokumenLaporan.identitas.length - 1" /></template>
        </p>
        <div class="dok__isi">
          <p v-for="p in dokumenLaporan.isi" :key="p">{{ p }}</p>
        </div>
        <div class="dok__sah">
          <p class="dok__kecil">Dokter penanggung jawab</p>
          <img :src="imgTandaTangan" alt="Tanda tangan ilustratif" class="dok__ttd" />
          <p class="dok__kecil t-strong">{{ dokumenLaporan.penanggungJawab }}</p>
          <UiBadge tone="success">{{ dokumenLaporan.esign }}</UiBadge>
        </div>
        <p class="dok__kaki">{{ dokumenLaporan.kaki }}</p>
      </article>

      <div class="sign__side stack">
        <UiCard title="Tanda tangan final">
          <FormField label="Radiolog">
            <input :value="radiolog" class="input" readonly />
          </FormField>
          <FormField label="PIN e-Sign" required :error="errorPin">
            <input
              v-model="pin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              class="input"
              :class="{ 'input--error': errorPin }"
              placeholder="••••••"
              autocomplete="off"
              :disabled="terbit"
            />
          </FormField>
          <CheckList :items="checklist" :disabled="terbit" />
          <UiButton variant="primary" class="self-start" :disabled="terbit" @click="tandaTangan">
            {{ terbit ? 'Sudah diterbitkan' : 'Tanda tangan & Terbitkan' }}
          </UiButton>
        </UiCard>

        <UiCard title="Pengiriman">
          <UiBadge v-for="s in pengiriman.status" :key="s" tone="success" class="self-start">{{ s }}</UiBadge>
          <p class="sign__catatan">
            <template v-for="(c, i) in pengiriman.catatan" :key="c">{{ c }}<br v-if="i < pengiriman.catatan.length - 1" /></template>
          </p>
          <UiButton class="self-start" @click="cetak">Cetak laporan</UiButton>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dok {
  min-width: 0; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 8px;
  padding: 32px; display: flex; flex-direction: column; gap: 20px;
}
.dok__rs { font-size: 16px; font-weight: 600; text-align: center; }
.dok__sub { font-size: 11px; color: var(--c-muted); text-align: center; }
.dok__kop { height: 2px; background: var(--c-primary); }
.dok__judul { font-size: 20px; font-weight: 600; text-align: center; }
.dok__identitas { font-size: 12px; }
.dok__isi { font-size: 13px; display: flex; flex-direction: column; gap: 10px; }
.dok__sah { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; padding-top: 16px; }
.dok__kecil { font-size: 12px; white-space: nowrap; }
.dok__ttd { width: 120px; height: 38px; display: block; }
.dok__kaki { font-size: 10px; color: var(--c-muted); }
.sign__side { width: 350px; flex-shrink: 0; gap: 16px; }
.sign__catatan { font-size: 12px; }
.self-start { align-self: flex-start; }
@media (max-width: 1100px) {
  .sign { flex-direction: column; }
  .sign__side { width: 100%; }
}
@media print {
  .sign__side { display: none; }
}
</style>
