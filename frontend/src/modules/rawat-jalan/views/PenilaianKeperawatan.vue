<script setup>
/** RJ-03 · Rawat jalan — Penilaian Keperawatan */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, UiCard, FormField } from '@/components/ui'
import { useNow, formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import WorkspaceTabs from './parts-a/WorkspaceTabs.vue'
import VitalCards from './parts-a/VitalCards.vue'
import { peringatanTd, penilaianAwal, skriningKeselamatan } from '../data-a'

const now = useNow()

const awal = () => Object.fromEntries(penilaianAwal.map((f) => [f.key, f.value]))
const form = reactive(awal())
const skrining = ref(skriningKeselamatan.map((s) => ({ ...s })))
const errors = reactive({})
const tersimpan = ref('')

function validasi() {
  let ok = true
  for (const f of penilaianAwal) {
    errors[f.key] = f.required && !String(form[f.key] ?? '').trim() ? 'Wajib diisi' : ''
    if (errors[f.key]) ok = false
  }
  return ok
}

function simpan() {
  if (!validasi()) return
  tersimpan.value = formatJam(now.value)
}

function batal() {
  Object.assign(form, awal())
  skrining.value = skriningKeselamatan.map((s) => ({ ...s }))
  Object.keys(errors).forEach((k) => (errors[k] = ''))
  tersimpan.value = ''
}

const belumSelesai = computed(() => skrining.value.filter((s) => !s.checked).length)
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner />
    <WorkspaceTabs active="Penilaian" />
    <VitalCards />

    <UiAlert tone="warning" :title="peringatanTd.title" :text="peringatanTd.text" />

    <div class="pk__main">
      <UiCard class="grow" title="Penilaian awal">
        <div class="pk__grid">
          <FormField
            v-for="f in penilaianAwal"
            :key="f.key"
            :label="f.label"
            :required="f.required"
            :error="errors[f.key]"
          >
            <input v-model="form[f.key]" class="input" :class="{ 'input--error': errors[f.key] }" />
          </FormField>
        </div>
      </UiCard>

      <UiCard class="pk__side" title="Skrining keselamatan">
        <div class="pk__checks">
          <label v-for="s in skrining" :key="s.label" class="check pk__check">
            <input v-model="s.checked" type="checkbox" />
            {{ s.label }}
          </label>
        </div>
        <p class="t-sm t-muted">Penilai: Ns. Maya · 09:05 WIB</p>
        <p v-if="belumSelesai" class="t-xs t-warning">{{ belumSelesai }} butir skrining belum selesai</p>
      </UiCard>
    </div>

    <UiAlert
      v-if="tersimpan"
      tone="success"
      title="Penilaian tersimpan"
      :text="`Ns. Maya · ${tersimpan} WIB · tersedia di workspace dokter.`"
    />

    <div class="row-between pk__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="pk__btns">
        <UiButton @click="batal">Batal</UiButton>
        <UiButton variant="primary" @click="simpan">Simpan penilaian</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pk__main { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.pk__side { width: 300px; flex-shrink: 0; }
.pk__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.pk__checks { display: flex; flex-direction: column; }
.pk__check { font-size: 13px; line-height: 32px; }
.pk__actions { width: 100%; flex-wrap: wrap; }
.pk__btns { display: flex; gap: 8px; }
@media (max-width: 1100px) {
  .pk__main { flex-direction: column; }
  .pk__side { width: 100%; }
}
@media (max-width: 640px) {
  .pk__grid { grid-template-columns: 1fr; }
}
</style>
