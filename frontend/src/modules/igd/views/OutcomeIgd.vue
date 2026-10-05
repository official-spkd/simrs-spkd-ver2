<script setup>
/** IGD-05 · IGD — Outcome IGD */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiButton, UiAlert, UiCard, FormField } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import CheckList from './parts-a/CheckList.vue'
import {
  pasienAktif, tabOutcome, rujukanAwal, rawatInapAwal, pulangPaksaAwal, meninggalAwal, checklistOutcome, checklistTabLain,
} from '../data-a'

const tab = ref('Rujuk')
const rujukan = reactive({ ...rujukanAwal })
const ranap = reactive({ ...rawatInapAwal })
const pulang = reactive({ ...pulangPaksaAwal })
const meninggal = reactive({ ...meninggalAwal })
const errors = reactive({})
const pin = ref('')
const hasil = ref(null)
const ditutup = ref(false)

// Checklist per tab (tab Rujuk sesuai desain)
const checklists = reactive({
  Rujuk: checklistOutcome.map((c) => ({ ...c })),
  ...Object.fromEntries(Object.entries(checklistTabLain).map(([k, v]) => [k, v.map((label) => ({ label, done: false }))])),
})
const checklist = computed(() => checklists[tab.value])

const judulPanel = {
  'Rawat inap': 'Admisi rawat inap',
  Rujuk: 'Rujukan keluar / VClaim',
  'Pulang paksa': 'Pulang atas permintaan sendiri',
  Meninggal: 'Pernyataan kematian',
}

// Isian wajib per tab: [objek, kunci, label]
const wajib = {
  'Rawat inap': [[ranap, 'ruang', 'Ruang tujuan'], [ranap, 'dpjp', 'DPJP'], [ranap, 'alasan', 'Alasan rawat inap']],
  Rujuk: [[rujukan, 'rsPenerima', 'RS penerima'], [rujukan, 'dokterPenerima', 'Dokter penerima'], [rujukan, 'alasan', 'Alasan rujukan']],
  'Pulang paksa': [[pulang, 'alasan', 'Alasan pulang paksa'], [pulang, 'penanggungJawab', 'Penanggung jawab']],
  Meninggal: [[meninggal, 'waktu', 'Waktu kematian'], [meninggal, 'sebab', 'Sebab kematian']],
}

function gantiTab(t) {
  tab.value = t
  hasil.value = null
  Object.keys(errors).forEach((k) => delete errors[k])
}

function cetak() {
  hasil.value = { tone: 'info', title: 'Surat rujukan disiapkan', text: `Surat rujukan ${rujukan.nomor} siap dicetak.` }
}

function konfirmasi() {
  Object.keys(errors).forEach((k) => delete errors[k])
  for (const [obj, key, label] of wajib[tab.value]) if (!String(obj[key]).trim()) errors[key] = `${label} wajib diisi.`
  if (!/^\d{6}$/.test(pin.value)) errors.pin = 'PIN e-Sign 6 digit.'
  if (Object.keys(errors).length) {
    hasil.value = { tone: 'danger', title: 'Outcome belum lengkap', text: 'Lengkapi isian bertanda * dan PIN e-Sign.' }
    return
  }
  const belum = checklist.value.filter((c) => !c.done).map((c) => c.label)
  if (belum.length) {
    hasil.value = { tone: 'warning', title: 'Checklist belum lengkap', text: `Belum dicentang: ${belum.join(', ')}.` }
    return
  }
  ditutup.value = true
  pin.value = ''
  hasil.value = { tone: 'success', title: 'Outcome dikonfirmasi', text: `Episode IGD ${pasienAktif.nama} ditutup · outcome: ${tab.value}.` }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <SegTabs :model-value="tab" :tabs="tabOutcome" @update:model-value="gantiTab" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <div class="row outcome">
      <UiCard class="grow" :title="judulPanel[tab]">
        <!-- Rujuk (sesuai desain) -->
        <template v-if="tab === 'Rujuk'">
          <div class="grid-2">
            <FormField label="RS penerima" required :error="errors.rsPenerima">
              <input v-model="rujukan.rsPenerima" class="input" />
            </FormField>
            <FormField label="Dokter penerima" required :error="errors.dokterPenerima">
              <input v-model="rujukan.dokterPenerima" class="input" />
            </FormField>
            <FormField label="Alasan rujukan" required :error="errors.alasan">
              <input v-model="rujukan.alasan" class="input" />
            </FormField>
            <FormField label="Tanggal / waktu">
              <input v-model="rujukan.waktu" class="input" />
            </FormField>
            <FormField label="Transportasi">
              <input v-model="rujukan.transportasi" class="input" />
            </FormField>
            <FormField label="Nomor rujukan">
              <input v-model="rujukan.nomor" class="input" readonly />
            </FormField>
          </div>
          <FormField label="Kondisi & terapi selama transfer">
            <textarea v-model="rujukan.kondisi" class="textarea" />
          </FormField>
          <UiButton class="self-start" @click="cetak">Cetak surat rujukan</UiButton>
        </template>

        <!-- Rawat inap -->
        <template v-else-if="tab === 'Rawat inap'">
          <div class="grid-2">
            <FormField label="Ruang tujuan" required :error="errors.ruang">
              <input v-model="ranap.ruang" class="input" />
            </FormField>
            <FormField label="DPJP" required :error="errors.dpjp">
              <input v-model="ranap.dpjp" class="input" />
            </FormField>
          </div>
          <FormField label="Alasan rawat inap" required :error="errors.alasan">
            <textarea v-model="ranap.alasan" class="textarea" />
          </FormField>
          <UiButton class="self-start" to="/rawat-inap/admisi-ranap">Buka admisi ranap</UiButton>
        </template>

        <!-- Pulang paksa -->
        <template v-else-if="tab === 'Pulang paksa'">
          <FormField label="Penanggung jawab" required :error="errors.penanggungJawab">
            <input v-model="pulang.penanggungJawab" class="input" placeholder="Nama & hubungan dengan pasien" />
          </FormField>
          <FormField label="Alasan pulang paksa" required :error="errors.alasan">
            <textarea v-model="pulang.alasan" class="textarea" placeholder="Alasan yang disampaikan pasien / keluarga" />
          </FormField>
        </template>

        <!-- Meninggal -->
        <template v-else>
          <FormField label="Waktu kematian" required :error="errors.waktu">
            <input v-model="meninggal.waktu" class="input" placeholder="14 Mei 2025 10:00" />
          </FormField>
          <FormField label="Sebab kematian" required :error="errors.sebab">
            <textarea v-model="meninggal.sebab" class="textarea" />
          </FormField>
        </template>
      </UiCard>

      <UiCard class="outcome__side" title="Persetujuan & penutupan">
        <CheckList :items="checklist" />
        <UiAlert
          tone="warning"
          title="Pulang paksa / meninggal"
          text="Jika dipilih, wajib alasan, persetujuan / dokumen kematian dan konfirmasi sebelum penutupan."
        />
        <FormField label="PIN e-Sign" :error="errors.pin">
          <input v-model="pin" class="input" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="off" />
        </FormField>
        <UiButton variant="primary" class="self-start" :disabled="ditutup" @click="konfirmasi">
          {{ ditutup ? 'Episode ditutup' : 'Konfirmasi outcome' }}
        </UiButton>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.outcome__side { width: 330px; flex-shrink: 0; }
.self-start { align-self: flex-start; }
.textarea { min-height: 92px; }
@media (max-width: 1100px) {
  .outcome { flex-direction: column; }
  .outcome__side { width: 100%; }
}
@media (max-width: 700px) {
  .grid-2 { grid-template-columns: minmax(0, 1fr); }
}
</style>
