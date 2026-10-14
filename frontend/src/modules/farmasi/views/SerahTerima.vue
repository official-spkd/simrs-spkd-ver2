<script setup>
/** FRS-04 · Farmasi — Serah Terima */
import { reactive, ref } from 'vue'
import { PageHeader, UiButton, UiBadge, UiAlert, UiCard, DataTable, FormField } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienResep, itemResep, antreanFarmasi, edukasiObat, penerimaAwal } from '../data-a'

/* ---------- Verifikasi antrean ---------- */
const antrean = ref(antreanFarmasi)
const verifikasi = ref({ tone: 'success', text: '✓ Nama dan tanggal lahir terkonfirmasi' })

function cekAntrean() {
  const ok = /F-007|BUDI SANTOSO/i.test(antrean.value)
  verifikasi.value = ok
    ? { tone: 'success', text: '✓ Nama dan tanggal lahir terkonfirmasi' }
    : { tone: 'danger', text: '✕ Nomor antrean tidak sesuai dengan pasien' }
}

/* ---------- Edukasi & konfirmasi ---------- */
const edukasi = reactive(edukasiObat.map((e) => ({ ...e })))
const penerima = ref(penerimaAwal)
const errPenerima = ref('')
const peringatan = ref(null)
const diserahkan = ref(null) // jam serah terima

const kolom = [
  { key: 'obat', label: 'Obat', strong: true },
  { key: 'jumlah', label: 'Diserahkan' },
  { key: 'aturan', label: 'Aturan' },
]
const terpilih = ref(itemResep[0].id)

function konfirmasi() {
  errPenerima.value = penerima.value.trim() ? '' : 'Penerima wajib diisi.'
  const belum = edukasi.filter((e) => !e.done).map((e) => e.label)
  if (errPenerima.value || verifikasi.value.tone !== 'success') {
    peringatan.value = { tone: 'danger', title: 'Serah terima belum dapat dikonfirmasi', text: 'Pastikan identitas pasien cocok dan penerima terisi.' }
    return
  }
  if (belum.length) {
    peringatan.value = { tone: 'warning', title: 'Edukasi belum lengkap', text: `Belum dicentang: ${belum.join(', ')}.` }
    return
  }
  peringatan.value = null
  diserahkan.value = formatJam(new Date())
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienResep" />

    <label class="scan">
      <span class="scan__label">Scan QR / nomor antrean farmasi</span>
      <input v-model="antrean" class="input" @keydown.enter.prevent="cekAntrean" @change="cekAntrean" />
      <span class="scan__hint" :class="`t-${verifikasi.tone}`">{{ verifikasi.text }}</span>
    </label>

    <UiAlert v-if="peringatan" :tone="peringatan.tone" :title="peringatan.title" :text="peringatan.text" />

    <div class="row serah">
      <UiCard class="grow" title="Edukasi obat">
        <CheckList :items="edukasi" />
        <FormField label="Penerima" required :error="errPenerima">
          <input v-model="penerima" class="input" :class="{ 'input--error': errPenerima }" :readonly="!!diserahkan" />
        </FormField>
        <UiButton variant="primary" class="self-start" :disabled="!!diserahkan" @click="konfirmasi">
          {{ diserahkan ? 'Serah terima dikonfirmasi' : 'Konfirmasi serah terima' }}
        </UiButton>
      </UiCard>

      <UiCard class="serah__side" :title="diserahkan ? 'Dispensing selesai' : 'Dispensing'">
        <DataTable
          v-model:selected="terpilih"
          class="serah__tabel"
          :columns="kolom"
          :rows="itemResep"
          selectable
          :searchable="false"
          :filterable="false"
          :exportable="false"
          :paginated="false"
        />
        <template v-if="diserahkan">
          <UiAlert
            tone="success"
            title="Obat berhasil diserahkan"
            :text="`14 Mei ${diserahkan} WIB · Apt. Ratna · identitas pasien cocok`"
          />
          <UiBadge tone="success" class="self-start">MedicationDispense · Terkirim {{ diserahkan }}</UiBadge>
          <p class="t-sm">Stok dikurangi: 7 tablet / item. Catatan edukasi tersedia di RME.</p>
        </template>
        <template v-else>
          <UiAlert tone="info" title="Menunggu konfirmasi serah terima" text="Lengkapi edukasi obat lalu konfirmasi penerima." />
          <UiBadge tone="neutral" class="self-start">MedicationDispense · Belum dikirim</UiBadge>
          <p class="t-sm">Stok akan dikurangi setelah serah terima dikonfirmasi.</p>
        </template>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.scan { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.scan__label { font-size: 12px; font-weight: 600; color: var(--c-muted); }
.scan__hint { font-size: 11px; }
.serah__side { width: 420px; flex-shrink: 0; }
.serah__tabel :deep(.dt__table) { min-width: 0; }
.self-start { align-self: flex-start; }
@media (max-width: 1100px) {
  .serah { flex-direction: column; }
  .serah__side { width: 100%; }
}
</style>
