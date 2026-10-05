<script setup>
/** MD-07 · Master data — Master Tarif */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, UiModal, FormField, DataTable } from '@/components/ui'
import SegTabs from './parts-b/SegTabs.vue'
import AksiHalaman from './parts-b/AksiHalaman.vue'
import { tabPenjamin, tarifAktif, tarif, riwayatVersiTarif } from '../data-b'
import { formatRupiah } from '@/utils/format'

// Salinan kerja per penjamin; "Batal" mengembalikan ke versi aktif.
const salin = () => Object.fromEntries(Object.entries(tarif).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))]))
const kerja = reactive(salin())
const tab = ref(tabPenjamin[0])
const rows = computed(() => kerja[tab.value])
const selected = ref(rows.value[0].id)
const berubah = ref(false)
const pesan = ref(null)

const kelas = [
  { key: 'k3', label: 'Kelas 3' },
  { key: 'k2', label: 'Kelas 2' },
  { key: 'k1', label: 'Kelas 1' },
  { key: 'vip', label: 'VIP' },
]
const columns = [
  { key: 'tindakan', label: 'Tindakan', strong: true },
  ...kelas.map((k) => ({ key: k.key, label: k.label, format: formatRupiah })),
]

// Dialog ubah / tambah tindakan
const modal = ref(false)
const edit = reactive({ id: null, tindakan: '', k3: 0, k2: 0, k1: 0, vip: 0 })
const err = ref('')
function bukaEdit(row) {
  Object.assign(edit, row)
  err.value = ''
  modal.value = true
}
function bukaBaru() {
  Object.assign(edit, { id: null, tindakan: '', k3: 0, k2: 0, k1: 0, vip: 0 })
  err.value = ''
  modal.value = true
}
function terapkan() {
  if (!edit.tindakan.trim()) return (err.value = 'Nama tindakan wajib diisi')
  if (kelas.some((k) => !(Number(edit[k.key]) > 0))) return (err.value = 'Seluruh tarif kelas harus lebih dari 0')
  const data = { ...edit, ...Object.fromEntries(kelas.map((k) => [k.key, Number(edit[k.key])])) }
  if (edit.id) Object.assign(rows.value.find((r) => r.id === edit.id), data)
  else {
    data.id = `t-${Date.now()}`
    rows.value.push(data)
    selected.value = data.id
  }
  modal.value = false
  berubah.value = true
  pesan.value = { tone: 'warning', title: 'Perubahan belum disimpan', text: 'Klik "Simpan tarif" untuk mengesahkan perubahan sebagai draf versi baru.' }
}

function batal() {
  Object.assign(kerja, salin())
  berubah.value = false
  pesan.value = null
}
function simpan() {
  if (!berubah.value) {
    pesan.value = { tone: 'info', title: 'Tidak ada perubahan', text: 'Tarif aktif v2025.05 tetap berlaku.' }
    return
  }
  berubah.value = false
  pesan.value = { tone: 'success', title: 'Tarif tersimpan', text: `Draf v2025.06 untuk penjamin ${tab.value} menunggu pengesahan direktur.` }
}

const modalVersi = ref(false)
const kolomVersi = [
  { key: 'versi', label: 'Versi', strong: true },
  { key: 'berlaku', label: 'Berlaku' },
  { key: 'pengesah', label: 'Disahkan' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Aktif' ? 'success' : null) },
]
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" @click="bukaBaru">+ Baru</UiButton>
    </PageHeader>

    <SegTabs v-model="tab" :tabs="tabPenjamin" />

    <UiAlert tone="info" :title="tarifAktif.title" :text="tarifAktif.text" />
    <UiAlert v-if="pesan" :tone="pesan.tone" :title="pesan.title" :text="pesan.text" />

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      selectable
      :export-name="`tarif-${tab.toLowerCase()}`"
      @row-click="bukaEdit"
    />

    <AksiHalaman>
      <UiButton @click="batal">Batal</UiButton>
      <UiButton @click="modalVersi = true">Riwayat versi</UiButton>
      <UiButton variant="primary" @click="simpan">Simpan tarif</UiButton>
    </AksiHalaman>

    <UiModal v-model:open="modal" :title="edit.id ? `Ubah tarif · ${edit.tindakan}` : 'Tindakan baru'" :subtitle="`Penjamin ${tab} · v2025.05`">
      <FormField label="Tindakan" required>
        <input v-model="edit.tindakan" class="input" />
      </FormField>
      <div class="grid-4 md-tarif">
        <FormField v-for="k in kelas" :key="k.key" :label="`${k.label} (Rp)`" required>
          <input v-model.number="edit[k.key]" type="number" min="0" step="1000" class="input" />
        </FormField>
      </div>
      <p v-if="err" class="t-xs t-danger">{{ err }}</p>
      <template #footer>
        <UiButton @click="modal = false">Batal</UiButton>
        <UiButton variant="primary" @click="terapkan">Terapkan</UiButton>
      </template>
    </UiModal>

    <UiModal v-model:open="modalVersi" title="Riwayat versi tarif" subtitle="Versi lama tetap tersimpan untuk audit klaim.">
      <DataTable :columns="kolomVersi" :rows="riwayatVersiTarif" :searchable="false" :filterable="false" :exportable="false" :paginated="false" />
    </UiModal>
  </div>
</template>

<style scoped>
@media (max-width: 800px) {
  .md-tarif { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
