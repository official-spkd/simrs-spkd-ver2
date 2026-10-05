<script setup>
/** PDR-05 · Pendaftaran — Panel BPJS */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, StatCard, DataTable, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import BannerPasien from './parts-a/BannerPasien.vue'
import { pasienKunjungan } from '../data-a'
import { ringkasanBpjs, pesertaBpjs, ketentuanPelayanan, riwayatKunjungan90 } from '../data-b'

const form = reactive({ ...pesertaBpjs })
const jamSep = ref(pesertaBpjs.jamSep)
const memproses = ref(false)
const dicoba = ref(false)
const selected = ref(1)

const errors = computed(() => {
  const e = {}
  if (!form.noKartu.trim()) e.noKartu = 'Nomor kartu wajib diisi'
  if (!form.noRujukan.trim()) e.noRujukan = 'Nomor rujukan wajib diisi'
  return e
})
const err = (k) => (dicoba.value ? errors.value[k] : '')

// Simulasi pembuatan SEP ke VClaim
function buatSep() {
  dicoba.value = true
  if (Object.keys(errors.value).length) return
  memproses.value = true
  form.noSep = ''
  setTimeout(() => {
    const n = String(Math.floor(Math.random() * 900) + 100)
    form.noSep = `SEP-DEMO-140525-${n}`
    jamSep.value = formatJam(new Date())
    memproses.value = false
  }, 700)
}

const cetak = () => window.print()

const columns = [
  { key: 'tanggal', label: 'Tanggal', strong: true },
  { key: 'poli', label: 'Poli' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'sep', label: 'SEP' },
  { key: 'status', label: 'Status' },
]
</script>

<template>
  <div class="page">
    <PageHeader />

    <BannerPasien :pasien="pasienKunjungan" penjamin="BPJS Kelas 2" status="J-07 · Poli Jantung" />

    <div class="grid-3">
      <StatCard v-for="s in ringkasanBpjs" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <div class="row bpjs__main">
      <UiCard class="grow" title="Data peserta BPJS">
        <div class="grid-2">
          <FormField label="NIK">
            <input v-model="form.nik" class="input" readonly />
          </FormField>
          <FormField label="Nomor kartu" :error="err('noKartu')">
            <input v-model="form.noKartu" class="input" />
          </FormField>
          <FormField label="Nama peserta">
            <input v-model="form.nama" class="input" readonly />
          </FormField>
          <FormField label="Faskes tingkat I">
            <input v-model="form.faskes" class="input" readonly />
          </FormField>
          <FormField label="Nomor rujukan" :error="err('noRujukan')">
            <input v-model="form.noRujukan" class="input" />
          </FormField>
          <FormField label="Nomor SEP">
            <input :value="memproses ? 'Memproses…' : form.noSep" class="input" readonly />
          </FormField>
        </div>
        <div>
          <UiButton variant="primary" :disabled="memproses" @click="buatSep">
            {{ memproses ? 'Membuat SEP…' : 'Buat SEP' }}
          </UiButton>
        </div>
        <div v-if="form.noSep && !memproses">
          <UiBadge tone="success">SEP berhasil dibuat · {{ jamSep }} WIB</UiBadge>
        </div>
      </UiCard>

      <UiCard class="bpjs__side" title="Ketentuan pelayanan">
        <p>{{ ketentuanPelayanan }}</p>
        <UiAlert tone="success" title="Kelas sesuai hak peserta" text="Kelas 2 terpilih. Tidak ada selisih biaya." />
        <div><UiButton :disabled="!form.noSep || memproses" @click="cetak">Cetak SEP</UiButton></div>
      </UiCard>
    </div>

    <DataTable
      v-model:selected="selected"
      title="Riwayat kunjungan 90 hari"
      :columns="columns"
      :rows="riwayatKunjungan90"
      selectable
      export-name="riwayat-kunjungan-90-hari"
    />
  </div>
</template>

<style scoped>
.bpjs__main { width: 100%; }
.bpjs__side { width: 320px; flex-shrink: 0; }
.grid-3 { width: 100%; }
@media (max-width: 1100px) {
  .bpjs__main { flex-direction: column; }
  .bpjs__side { width: 100%; }
}
@media (max-width: 720px) {
  .grid-2,
  .grid-3 { grid-template-columns: 1fr; }
}
</style>
