<script setup>
/** RJ-07 · Rawat jalan — Tutup Kunjungan (dialog di atas workspace pasien) */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiButton, UiModal, FormField } from '@/components/ui'
import { useNow, formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import WorkspaceTabs from './parts-a/WorkspaceTabs.vue'
import VitalCards from './parts-a/VitalCards.vue'
import WorkspaceOverview from './parts-a/WorkspaceOverview.vue'
import { icd10 } from '../data-a'
import { tutupAwal, opsiStatusPulang } from '../data-b'

const router = useRouter()
const now = useNow()

const open = ref(true)
const form = reactive({ ...tutupAwal })
const ditinjau = ref(true)
const errors = reactive({ diagnosis: '', statusPulang: '', ditinjau: '' })
const selesai = ref('')

const diagnosisValid = computed(() => icd10.includes(form.diagnosis.trim()))

function konfirmasi() {
  errors.diagnosis = !form.diagnosis.trim() ? 'Diagnosis akhir wajib diisi' : !diagnosisValid.value ? 'Pilih kode ICD-10 yang valid' : ''
  errors.statusPulang = form.statusPulang ? '' : 'Status pulang wajib dipilih'
  errors.ditinjau = ditinjau.value ? '' : 'Centang konfirmasi peninjauan terlebih dahulu'
  if (errors.diagnosis || errors.statusPulang || errors.ditinjau) return
  selesai.value = `${form.diagnosis} · ${form.statusPulang} · Encounter selesai ${formatJam(now.value)} WIB`
  open.value = false
}
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner />
    <WorkspaceTabs active="Penilaian" />
    <VitalCards />

    <UiAlert v-if="selesai" tone="success" title="Kunjungan ditutup" :text="selesai">
      <template #actions>
        <UiButton size="sm" to="/rawat-jalan/surat-center">Buat surat kontrol</UiButton>
        <UiButton size="sm" to="/rawat-jalan/worklist-poli">Kembali ke worklist</UiButton>
      </template>
    </UiAlert>

    <WorkspaceOverview
      @vital-sign="router.push('/rawat-jalan/penilaian-keperawatan')"
      @tambah-order="router.push('/rawat-jalan/order-terpadu')"
      @tutup-kunjungan="open = true"
    />

    <UiModal v-model:open="open" title="Tutup kunjungan">
      <UiAlert
        tone="info"
        title="Diagnosis akhir wajib diisi"
        text="Encounter hanya dapat selesai setelah diagnosis dan status pulang tervalidasi."
      />

      <FormField label="Diagnosis akhir ICD-10" required :error="errors.diagnosis">
        <input v-model="form.diagnosis" class="input" :class="{ 'input--error': errors.diagnosis }" list="rj-icd10-tutup" />
        <span v-if="!errors.diagnosis && diagnosisValid" class="tk__ok">✓ Diagnosis valid dan sesuai CPPT</span>
      </FormField>
      <datalist id="rj-icd10-tutup">
        <option v-for="d in icd10" :key="d" :value="d" />
      </datalist>

      <div class="tk__row">
        <FormField label="Status pulang" required :error="errors.statusPulang">
          <select v-model="form.statusPulang" class="select">
            <option v-for="s in opsiStatusPulang" :key="s">{{ s }}</option>
          </select>
        </FormField>
        <FormField label="Tanggal kontrol">
          <input v-model="form.kontrol" class="input" />
        </FormField>
      </div>

      <FormField label="Instruksi tindak lanjut">
        <input v-model="form.instruksi" class="input" />
      </FormField>

      <div class="stack-sm">
        <label class="check tk__check">
          <input v-model="ditinjau" type="checkbox" />
          Saya telah meninjau diagnosis, resep, dan hasil penunjang.
        </label>
        <p v-if="errors.ditinjau" class="t-xs t-danger">{{ errors.ditinjau }}</p>
      </div>

      <template #footer>
        <div class="row-between tk__foot">
          <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
          <div class="tk__btns">
            <UiButton @click="router.push('/rawat-jalan/workspace-pasien')">Kembali</UiButton>
            <UiButton variant="primary" @click="konfirmasi">Konfirmasi &amp; Tutup</UiButton>
          </div>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.tk__ok { font-size: 11px; color: var(--c-success); }
.tk__row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.tk__check { font-size: 13px; }
.tk__foot { width: 100%; flex-wrap: wrap; }
.tk__btns { display: flex; gap: 8px; }
@media (max-width: 640px) {
  .tk__row { grid-template-columns: 1fr; }
}
</style>
