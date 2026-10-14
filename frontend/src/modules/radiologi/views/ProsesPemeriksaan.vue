<script setup>
/** RAD-02 · Radiologi — Proses Pemeriksaan */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiButton, UiBadge, UiAlert, UiCard, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienAktif, tabPemeriksaan, checklistPemeriksaan, isianPemeriksaan, statusStudy } from '../data-a'

const tab = ref('Dose record')
const checklist = reactive(checklistPemeriksaan.map((c) => ({ ...c })))
const isian = reactive(Object.fromEntries(isianPemeriksaan.map((f) => [f.key, f.value])))
const errors = reactive({})
const hasil = ref(null)

const lengkap = computed(() => checklist.every((c) => c.done))

function simpan() {
  Object.keys(errors).forEach((k) => delete errors[k])
  for (const f of isianPemeriksaan) if (!String(isian[f.key]).trim()) errors[f.key] = `${f.label} wajib diisi.`
  if (Object.keys(errors).length) {
    hasil.value = { tone: 'danger', title: 'Data belum lengkap', text: 'Lengkapi isian pemeriksaan sebelum menyimpan.' }
    return
  }
  hasil.value = lengkap.value
    ? { tone: 'success', title: 'Pemeriksaan tersimpan', text: `Disimpan pukul ${formatJam(new Date())} WIB · studi masuk worklist radiolog.` }
    : { tone: 'warning', title: 'Pemeriksaan tersimpan sebagian', text: 'Checklist belum lengkap — konfirmasi kualitas gambar sebelum studi dibaca.' }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <SegTabs v-model="tab" :tabs="tabPemeriksaan" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row proses">
      <UiCard class="grow" title="Checklist pemeriksaan">
        <CheckList :items="checklist" />
        <div class="grid-2">
          <FormField v-for="f in isianPemeriksaan" :key="f.key" :label="f.label" :error="errors[f.key]">
            <input v-model="isian[f.key]" class="input" />
          </FormField>
        </div>
      </UiCard>

      <UiCard class="proses__side" title="Status study">
        <UiBadge v-for="b in statusStudy.badge" :key="b" tone="success" class="self-start">{{ b }}</UiBadge>
        <p class="proses__detail">
          <template v-for="(d, i) in statusStudy.detail" :key="d">{{ d }}<br v-if="i < statusStudy.detail.length - 1" /></template>
        </p>
        <UiAlert tone="success" :title="statusStudy.siap.title" :text="statusStudy.siap.text" />
        <UiButton variant="primary" class="self-start" to="/radiologi/viewer-radiologi">Buka Viewer</UiButton>
        <UiButton class="self-start" @click="simpan">Simpan pemeriksaan</UiButton>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.proses__side { width: 340px; flex-shrink: 0; }
.proses__detail { font-size: 14px; }
.self-start { align-self: flex-start; }
@media (max-width: 1100px) {
  .proses { flex-direction: column; }
  .proses__side { width: 100%; }
}
</style>
