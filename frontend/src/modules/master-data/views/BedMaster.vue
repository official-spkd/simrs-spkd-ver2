<script setup>
/** MD-06 · Master data — Peta Ruang — Bed Master */
import { computed, reactive, ref } from 'vue'
import { BedDouble } from 'lucide-vue-next'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, FormField, DataTable } from '@/components/ui'
import SegTabs from './parts-b/SegTabs.vue'
import { gedung, organisasi } from '../data-b'

const daftarGedung = reactive(gedung)
const tabKey = ref(daftarGedung[0].key)
const g = computed(() => daftarGedung.find((x) => x.key === tabKey.value))
const tabs = daftarGedung.map((x) => ({ key: x.key, label: x.label }))
const selected = ref(null)
const pesan = ref('')

const bedKamar = (kamarId) => g.value.bed.filter((b) => b.kamar === kamarId)

const columns = [
  { key: 'id', label: 'Bed', strong: true },
  { key: 'locationId', label: 'Location ID', format: (v) => v || 'Belum dipetakan' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'status', label: 'Status operasional', tone: (r) => (r.status === 'Aktif' ? 'success' : null) },
]

// Edit mapping Location per kamar
const modalMap = ref(false)
const kamarEdit = ref(null)
const isianMap = reactive({})
const errMap = reactive({})

function editMapping(k) {
  kamarEdit.value = k
  Object.keys(isianMap).forEach((x) => delete isianMap[x])
  Object.keys(errMap).forEach((x) => delete errMap[x])
  bedKamar(k.id).forEach((b) => (isianMap[b.id] = { locationId: b.locationId, status: b.status }))
  modalMap.value = true
}
function simpanMapping() {
  Object.keys(errMap).forEach((x) => delete errMap[x])
  Object.entries(isianMap).forEach(([id, v]) => {
    if (!/^LOC-[A-Z0-9-]+$/.test(v.locationId.trim())) errMap[id] = 'Format Location ID: LOC-…'
  })
  if (Object.keys(errMap).length) return
  bedKamar(kamarEdit.value.id).forEach((b) => Object.assign(b, { locationId: isianMap[b.id].locationId.trim(), status: isianMap[b.id].status }))
  kamarEdit.value.status = 'Location · Terkirim'
  modalMap.value = false
  pesan.value = `Mapping kamar ${kamarEdit.value.id} tersimpan dan Location dikirim ke Satu Sehat.`
}

// Bed baru pada lantai aktif
const modalBaru = ref(false)
const baru = reactive({ kamar: '', id: '', locationId: '', status: 'Aktif' })
const errBaru = ref('')
function bukaBaru() {
  Object.assign(baru, { kamar: g.value.kamar[0].id, id: '', locationId: '', status: 'Aktif' })
  errBaru.value = ''
  modalBaru.value = true
}
function simpanBaru() {
  if (!baru.id.trim()) return (errBaru.value = 'Kode bed wajib diisi')
  if (g.value.bed.some((b) => b.id === baru.id.trim())) return (errBaru.value = 'Kode bed sudah dipakai')
  const kamar = g.value.kamar.find((k) => k.id === baru.kamar)
  g.value.bed.push({ id: baru.id.trim(), kamar: baru.kamar, locationId: baru.locationId.trim(), kelas: kamar.kelas, status: baru.status })
  modalBaru.value = false
  pesan.value = `Bed ${baru.id} ditambahkan ke kamar ${baru.kamar}.`
}
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" @click="bukaBaru">+ Baru</UiButton>
    </PageHeader>

    <SegTabs v-model="tabKey" :tabs="tabs" />

    <UiAlert v-if="pesan" tone="success" title="Perubahan tersimpan" :text="pesan" />

    <div class="row md-body">
      <UiCard class="md-struktur" title="Struktur organisasi">
        <p class="t-body t-strong">{{ organisasi.nama }}</p>
        <p class="t-body md-pohon">{{ g.struktur.join('\n') }}</p>
        <div><UiBadge tone="success">{{ organisasi.status }}</UiBadge></div>
        <p class="t-sm">Org: {{ organisasi.orgId }}</p>
      </UiCard>

      <div class="grow stack">
        <UiCard :title="g.lantai">
          <div class="md-kamar">
            <div v-for="k in g.kamar" :key="k.id" class="card md-kamar__item">
              <p class="t-title">{{ k.id }} · Kelas {{ k.kelas }}</p>
              <BedDouble class="md-kamar__ikon" aria-hidden="true" />
              <p class="t-body">{{ bedKamar(k.id).map((b) => b.id).join(' · ') || 'Belum ada bed' }}</p>
              <div><UiBadge :tone="k.status.endsWith('Terkirim') ? 'success' : 'warning'">{{ k.status }}</UiBadge></div>
              <div><UiButton @click="editMapping(k)">Edit mapping</UiButton></div>
            </div>
          </div>
        </UiCard>

        <DataTable
          v-model:selected="selected"
          :columns="columns"
          :rows="g.bed"
          selectable
          :export-name="`bed-${g.key}`"
        />
      </div>
    </div>

    <UiModal v-model:open="modalMap" :title="`Edit mapping kamar ${kamarEdit?.id ?? ''}`" subtitle="Setiap bed dipetakan ke resource Location Satu Sehat.">
      <div v-for="(v, id) in isianMap" :key="id" class="grid-2">
        <FormField :label="`Location ID · ${id}`" required :error="errMap[id]">
          <input v-model="v.locationId" class="input" :class="{ 'input--error': errMap[id] }" placeholder="LOC-…" />
        </FormField>
        <FormField label="Status operasional">
          <select v-model="v.status" class="select">
            <option>Aktif</option>
            <option>Pemeliharaan</option>
            <option>Nonaktif</option>
          </select>
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="modalMap = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanMapping">Simpan mapping</UiButton>
      </template>
    </UiModal>

    <UiModal v-model:open="modalBaru" title="Bed baru" :subtitle="`${g.label} · ${g.lantai}`">
      <div class="grid-2">
        <FormField label="Kamar" required>
          <select v-model="baru.kamar" class="select">
            <option v-for="k in g.kamar" :key="k.id" :value="k.id">{{ k.id }} · Kelas {{ k.kelas }}</option>
          </select>
        </FormField>
        <FormField label="Kode bed" required :error="errBaru">
          <input v-model="baru.id" class="input" placeholder="mis. 301-3" />
        </FormField>
        <FormField label="Location ID" hint="Kosongkan bila belum dipetakan">
          <input v-model="baru.locationId" class="input" placeholder="LOC-…" />
        </FormField>
        <FormField label="Status operasional">
          <select v-model="baru.status" class="select">
            <option>Aktif</option>
            <option>Pemeliharaan</option>
          </select>
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="modalBaru = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanBaru">Simpan</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.md-struktur { width: 260px; flex-shrink: 0; }
.md-pohon { white-space: pre-wrap; }
.md-kamar { display: flex; gap: 16px; }
.md-kamar__item { flex: 1 1 0; }
.md-kamar__ikon { width: 30px; height: 30px; color: var(--c-text); }
@media (max-width: 1100px) {
  .md-body { flex-direction: column; }
  .md-struktur { width: 100%; }
  .md-kamar { flex-wrap: wrap; }
  .md-kamar__item { flex-basis: 200px; }
}
</style>
