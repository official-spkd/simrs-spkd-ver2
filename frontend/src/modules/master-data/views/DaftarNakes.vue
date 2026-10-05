<script setup>
/** MD-04 · Master data — Daftar Nakes */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiButton, UiModal, FormField, DataTable } from '@/components/ui'
import SegTabs from './parts-b/SegTabs.vue'
import { nakes, tabNakes } from '../data-a'

const router = useRouter()
const daftar = reactive(nakes)
const tab = ref('semua')
const selected = ref(daftar[0].id)

const rows = computed(() => (tab.value === 'semua' ? daftar : daftar.filter((n) => n.kategori === tab.value)))

const columns = [
  { key: 'nama', label: 'Nama nakes', strong: true },
  { key: 'nik', label: 'NIK' },
  { key: 'unit', label: 'Unit / spesialisasi' },
  { key: 'strSip', label: 'STR / SIP' },
  { key: 'statusIhs', label: 'Status IHS', tone: (r) => (r.kategori === 'proses' ? 'warning' : null) },
]

function bukaDetail(row) {
  router.push({ path: '/master-data/detail-nakes', query: { id: row.id } })
}

// Dialog nakes baru — tersimpan dengan status Belum IHS hingga Cek IHS berhasil.
const modalBaru = ref(false)
const baru = reactive({ nik: '', nama: '', unit: '', strSip: '' })
const err = reactive({})
const sukses = ref('')

function bukaBaru() {
  Object.assign(baru, { nik: '', nama: '', unit: '', strSip: 'STR aktif · SIP 2027' })
  Object.keys(err).forEach((k) => delete err[k])
  modalBaru.value = true
}
function simpanBaru() {
  Object.keys(err).forEach((k) => delete err[k])
  if (!/^\d{16}$/.test(baru.nik)) err.nik = 'NIK harus 16 digit angka'
  if (!baru.nama.trim()) err.nama = 'Nama wajib diisi'
  if (!baru.unit.trim()) err.unit = 'Unit wajib diisi'
  if (Object.keys(err).length) return
  const id = `N-${String(daftar.length + 1).padStart(3, '0')}`
  daftar.unshift({
    id, nama: baru.nama, nik: `${baru.nik.slice(0, 2)}XXXXXXXXXX`, unit: baru.unit, strSip: baru.strSip,
    statusIhs: 'Belum IHS', kategori: 'belum', ihsId: '', str: '', strBerlaku: '', sip: '', sipBerlaku: '',
    spesialisasi: baru.unit, unitPenempatan: baru.unit, percobaan: 'Belum pernah dicek',
  })
  selected.value = id
  tab.value = 'semua'
  modalBaru.value = false
  sukses.value = `${baru.nama} tersimpan dengan status PENDING_IHS. Buka detail untuk Cek IHS.`
}
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" @click="bukaBaru">+ Baru</UiButton>
    </PageHeader>

    <SegTabs v-model="tab" :tabs="tabNakes" />

    <UiAlert v-if="sukses" tone="success" title="Nakes ditambahkan" :text="sukses" />

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      selectable
      export-name="daftar-nakes"
      @row-click="bukaDetail"
    />

    <UiAlert
      tone="info"
      title="Practitioner harus terpetakan sebelum pengiriman klinis"
      text="Gunakan Cek IHS pada detail nakes. Nakes tanpa IHS tetap tersimpan dengan status pending."
    />

    <UiModal v-model:open="modalBaru" title="Nakes baru" subtitle="Practitioner dicari otomatis berdasarkan NIK setelah disimpan.">
      <div class="grid-2">
        <FormField label="NIK" required :error="err.nik">
          <input v-model="baru.nik" class="input" inputmode="numeric" maxlength="16" placeholder="16 digit" />
        </FormField>
        <FormField label="Nama lengkap" required :error="err.nama">
          <input v-model="baru.nama" class="input" placeholder="mis. dr. Nama, Sp.X" />
        </FormField>
        <FormField label="Unit / spesialisasi" required :error="err.unit">
          <input v-model="baru.unit" class="input" />
        </FormField>
        <FormField label="STR / SIP">
          <input v-model="baru.strSip" class="input" />
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="modalBaru = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanBaru">Simpan</UiButton>
      </template>
    </UiModal>
  </div>
</template>
