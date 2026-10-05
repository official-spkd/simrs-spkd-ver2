<script setup>
/** MD-05 · Master data — Detail Nakes. Query ?id=<N-xxx>; default dr. Bayu (PENDING_IHS). */
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, FormField } from '@/components/ui'
import SegTabs from './parts-b/SegTabs.vue'
import AksiHalaman from './parts-b/AksiHalaman.vue'
import { nakes, tabDetailNakes, nakesDefaultId, panduanIhs } from '../data-a'
import { formatJam } from '@/utils/format'

const route = useRoute()
const semua = reactive(nakes)
const n = computed(() => semua.find((x) => x.id === route.query.id) ?? semua.find((x) => x.id === nakesDefaultId))
const tab = ref(tabDetailNakes[0])

// Definisi isian; tab menentukan isian mana yang tampil.
const fields = [
  { key: 'nik', label: 'NIK', required: true, tabs: ['Identitas'] },
  { key: 'nama', label: 'Nama lengkap', required: true, tabs: ['Identitas'] },
  { key: 'str', label: 'Nomor STR', required: true, tabs: ['Identitas', 'STR & SIP'] },
  { key: 'strBerlaku', label: 'STR berlaku sampai', tabs: ['Identitas', 'STR & SIP'] },
  { key: 'sip', label: 'Nomor SIP', required: true, tabs: ['Identitas', 'STR & SIP'] },
  { key: 'sipBerlaku', label: 'SIP berlaku sampai', tabs: ['Identitas', 'STR & SIP'] },
  { key: 'spesialisasi', label: 'Spesialisasi', required: true, tabs: ['Identitas', 'Penempatan'] },
  { key: 'unitPenempatan', label: 'Unit penempatan', required: true, tabs: ['Identitas', 'Penempatan'] },
]
const fieldTampil = computed(() => fields.filter((f) => f.tabs.includes(tab.value)))

const form = reactive({})
const errors = reactive({})
const pesan = ref(null)

function isiForm() {
  fields.forEach((f) => (form[f.key] = n.value[f.key] ?? ''))
  Object.keys(errors).forEach((k) => delete errors[k])
}
watch(n, isiForm, { immediate: true })

function batal() {
  isiForm()
  pesan.value = null
}
function simpan() {
  Object.keys(errors).forEach((k) => delete errors[k])
  fields.forEach((f) => {
    if (f.required && !String(form[f.key]).trim()) errors[f.key] = `${f.label} wajib diisi`
  })
  if (Object.keys(errors).length) {
    tab.value = 'Identitas'
    pesan.value = { tone: 'danger', title: 'Data belum lengkap', text: 'Lengkapi isian bertanda * sebelum menyimpan.' }
    return
  }
  Object.assign(n.value, form)
  pesan.value = { tone: 'success', title: 'Profil nakes tersimpan', text: `${form.nama} · perubahan tercatat dalam jejak audit.` }
}

// Cek IHS — simulasi pencarian Practitioner berdasarkan NIK.
const terdaftar = computed(() => !!n.value.ihsId)
const mengecek = ref(false)
function cekIhs() {
  mengecek.value = true
  setTimeout(() => {
    mengecek.value = false
    const jam = formatJam(new Date())
    if (n.value.kategori === 'proses') {
      // Nakes yang sedang diproses dianggap selesai terdaftar.
      Object.assign(n.value, { ihsId: `1000${Math.floor(1000000 + Math.random() * 8999999)}`, kategori: 'ada', statusIhs: 'Ada · IHS ✓' })
      n.value.percobaan = `Hari ini ${jam} · terdaftar`
    } else if (!terdaftar.value) {
      n.value.percobaan = `Hari ini ${jam} · belum terdaftar`
    } else {
      n.value.percobaan = `Hari ini ${jam} · terdaftar`
    }
  }, 900)
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <SegTabs v-model="tab" :tabs="tabDetailNakes" />

    <UiAlert v-if="pesan" :tone="pesan.tone" :title="pesan.title" :text="pesan.text" />

    <div class="row md-body">
      <UiCard class="grow" title="Profil tenaga kesehatan">
        <div v-if="tab !== 'Mapping IHS'" class="grid-2">
          <FormField v-for="f in fieldTampil" :key="f.key" :label="f.label" :required="f.required" :error="errors[f.key]">
            <input v-model="form[f.key]" class="input" :class="{ 'input--error': errors[f.key] }" />
            <span v-if="f.key === 'nik' && !errors.nik" class="t-xs t-success">✓ Identitas Dukcapil</span>
          </FormField>
        </div>
        <dl v-else class="kv">
          <dt>NIK</dt><dd>{{ n.nik }}</dd>
          <dt>Practitioner IHS</dt><dd>{{ n.ihsId || 'Belum ditemukan' }}</dd>
          <dt>Status</dt><dd :class="terdaftar ? 't-success' : 't-warning'">{{ n.statusIhs }}</dd>
          <dt>Unit → Organization</dt><dd>{{ n.unitPenempatan }} · ORG-DEMO-SPKD</dd>
        </dl>
        <AksiHalaman>
          <UiButton @click="batal">Batal</UiButton>
          <UiButton variant="primary" @click="simpan">Simpan</UiButton>
        </AksiHalaman>
      </UiCard>

      <UiCard class="md-ihs" title="Practitioner Satu Sehat">
        <div>
          <UiBadge :tone="terdaftar ? 'success' : 'warning'">{{ terdaftar ? `IHS ✓ · ${n.ihsId}` : 'PENDING_IHS' }}</UiBadge>
        </div>
        <p class="t-body">
          <template v-if="terdaftar">Practitioner ditemukan dan terpetakan ke data pegawai.</template>
          <template v-else>IHS belum ditemukan untuk NIK ini. Data pegawai tetap dapat disimpan.</template>
        </p>
        <div>
          <UiButton variant="primary" :disabled="mengecek" @click="cekIhs">
            {{ mengecek ? 'Mengecek…' : 'Cek IHS Satu Sehat' }}
          </UiButton>
        </div>
        <UiAlert v-if="!terdaftar" tone="warning" title="Panduan registrasi IHS" :text="panduanIhs" />
        <p class="t-sm t-muted">Percobaan terakhir {{ n.percobaan }}</p>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.md-ihs { width: 350px; flex-shrink: 0; }
@media (max-width: 1100px) {
  .md-body { flex-direction: column; }
  .md-ihs { width: 100%; }
}
@media (max-width: 700px) {
  .grid-2 { grid-template-columns: minmax(0, 1fr); }
}
</style>
