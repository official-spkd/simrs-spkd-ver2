<script setup>
/** RME-03 · RME — Consent Center */
import { computed, reactive, ref, watch } from 'vue'
import { PageHeader, UiAlert, UiButton, UiCard, DataTable, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import SignaturePad from './parts-a/SignaturePad.vue'
import { pasienAktif, daftarPersetujuan, teksPersetujuan, butirPersetujuan } from '../data-a'

const rows = ref(daftarPersetujuan.map((r) => ({ ...r })))
const selected = ref(rows.value[0].id)
const aktif = computed(() => rows.value.find((r) => r.id === selected.value) ?? rows.value[0])

const columns = [
  { key: 'persetujuan', label: 'Persetujuan', strong: true },
  { key: 'episode', label: 'Episode' },
  { key: 'pemberi', label: 'Pemberi' },
  { key: 'waktu', label: 'Waktu' },
  { key: 'status', label: 'Status' },
]

// Formulir persetujuan untuk baris terpilih
const form = reactive({ cek: [], nama: '' })
const padTerisi = ref(false)
const pakaiContoh = ref(true)
const pad = ref(null)
const error = ref('')
const hasil = ref(null)

function muatForm() {
  const r = aktif.value
  // Contoh desain: butir terakhir (konfirmasi tablet) belum dicentang
  form.cek = r.ttd ? butirPersetujuan.slice(0, 3) : []
  form.nama = r.ttd ? r.pemberi : pasienAktif.nama
  pakaiContoh.value = r.ttd
  padTerisi.value = r.ttd
  error.value = ''
}
watch(selected, () => {
  hasil.value = null
  muatForm()
}, { immediate: true })

const keteranganTtd = computed(() =>
  pakaiContoh.value ? `Tanda tangan ilustratif · ${aktif.value.waktu}` : padTerisi.value ? 'Tanda tangan baru · belum disimpan' : 'Belum ada tanda tangan',
)

function ulangi() {
  pakaiContoh.value = false
  padTerisi.value = false
  pad.value?.kosongkan()
}

function simpan() {
  if (!form.nama.trim()) return (error.value = 'Nama penandatangan wajib diisi')
  error.value = ''
  if (form.cek.length < butirPersetujuan.length) {
    hasil.value = { tone: 'warning', title: 'Checklist belum lengkap', text: 'Centang seluruh butir persetujuan sebelum menyimpan.' }
    return
  }
  if (!padTerisi.value) {
    hasil.value = { tone: 'warning', title: 'Tanda tangan belum ada', text: 'Minta penandatangan membubuhkan tanda tangan di tablet.' }
    return
  }
  const jam = formatJam(new Date())
  Object.assign(aktif.value, {
    pemberi: form.nama.trim(),
    waktu: `14 Mei ${jam}`,
    status: 'Ditandatangani',
    episode: aktif.value.ttd ? aktif.value.episode : '14 Mei · Jantung',
    ttd: true,
  })
  hasil.value = {
    tone: 'success',
    title: 'Persetujuan tersimpan',
    text: `Persetujuan ${aktif.value.persetujuan.toLowerCase()} ditandatangani ${form.nama.trim()} pukul ${jam} WIB · tercatat dalam jejak audit.`,
  }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <DataTable v-model:selected="selected" :columns="columns" :rows="rows" selectable export-name="consent" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="cc">
      <UiCard class="grow" :title="`Persetujuan ${aktif.persetujuan.toLowerCase()}`">
        <p class="cc__text">{{ teksPersetujuan }}</p>
        <div class="cc__checks">
          <label v-for="b in butirPersetujuan" :key="b" class="check cc__check">
            <input v-model="form.cek" type="checkbox" :value="b" />
            {{ b }}
          </label>
        </div>
        <FormField label="Nama penandatangan" required :error="error">
          <input v-model="form.nama" class="input" />
        </FormField>
      </UiCard>

      <UiCard class="cc__pad" title="Tablet tanda tangan">
        <SignaturePad ref="pad" v-model="padTerisi" :sample="pakaiContoh" />
        <p class="t-sm t-muted">{{ keteranganTtd }}</p>
        <div class="row">
          <UiButton @click="ulangi">Ulangi</UiButton>
          <UiButton variant="primary" @click="simpan">Simpan persetujuan</UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.cc { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.cc__pad { width: 380px; flex-shrink: 0; }
.cc__text { font-size: 14px; }
.cc__checks { display: flex; flex-direction: column; }
.cc__check { font-size: 13px; line-height: 32px; }
@media (max-width: 1100px) {
  .cc { flex-direction: column; }
  .cc__pad { width: 100%; }
}
</style>
