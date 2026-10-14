<script setup>
/** RAD-04 · Radiologi — Reporting */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiButton, UiAlert, UiCard, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import { pasienAktif, tabTemplat, laporanAwal, konteksStudi, catatanIlustratif } from '../data-a'

const router = useRouter()
const templat = ref(tabTemplat[0])
// Isian disimpan per templat agar berpindah tab tidak menghapus ketikan
const laporan = reactive(Object.fromEntries(tabTemplat.map((t) => [t, { ...laporanAwal[t] }])))
const form = computed(() => laporan[templat.value])
const kesanTerisi = computed(() => form.value.kesan.trim().length > 0)
const coba = ref(false)
const hasil = ref(null)

function simpanDraft() {
  hasil.value = { tone: 'info', title: 'Draft tersimpan', text: `Laporan ${templat.value} disimpan sebagai draft pukul ${formatJam(new Date())} WIB.` }
}

function lanjutESign() {
  coba.value = true
  if (!kesanTerisi.value) {
    hasil.value = { tone: 'danger', title: 'Kesan belum diisi', text: 'Impression / Kesan wajib diisi sebelum lanjut e-Sign.' }
    return
  }
  router.push('/radiologi/sign-dan-publish')
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row lapor">
      <UiCard class="grow" title="Editor laporan terstruktur">
        <SegTabs v-model="templat" :tabs="tabTemplat" />
        <FormField label="Teknik">
          <input v-model="form.teknik" class="input" />
        </FormField>
        <FormField label="Temuan">
          <textarea v-model="form.temuan" class="textarea" />
        </FormField>
        <div class="field-wrap">
          <FormField label="Impression / Kesan" required>
            <textarea v-model="form.kesan" class="textarea" :class="{ 'input--error': coba && !kesanTerisi }" />
          </FormField>
          <p v-if="kesanTerisi" class="t-xs t-success">✓ Kesan wajib terisi</p>
          <p v-else class="t-xs" :class="coba ? 't-danger' : 't-muted'">Kesan wajib diisi</p>
        </div>
        <FormField label="Rekomendasi">
          <input v-model="form.rekomendasi" class="input" />
        </FormField>
        <div class="row-between lapor__aksi">
          <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
          <div class="row gap-8">
            <UiButton @click="simpanDraft">Simpan draft</UiButton>
            <UiButton variant="primary" @click="lanjutESign">Simpan &amp; lanjut e-Sign</UiButton>
          </div>
        </div>
      </UiCard>

      <UiCard class="lapor__side" title="Konteks studi">
        <p class="lapor__konteks">
          <template v-for="(k, i) in konteksStudi" :key="k">{{ k }}<br v-if="i < konteksStudi.length - 1" /></template>
        </p>
        <UiAlert tone="warning" :title="catatanIlustratif.title" :text="catatanIlustratif.text" />
        <UiButton class="self-start" to="/radiologi/viewer-radiologi">Buka citra</UiButton>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.lapor__side { width: 320px; flex-shrink: 0; }
.lapor__konteks { font-size: 14px; }
.field-wrap { display: flex; flex-direction: column; gap: 6px; }
.textarea { min-height: 92px; }
.gap-8 { gap: 8px; }
.self-start { align-self: flex-start; }
@media (max-width: 1100px) {
  .lapor { flex-direction: column; }
  .lapor__side { width: 100%; }
  .lapor__aksi { flex-wrap: wrap; }
}
</style>
