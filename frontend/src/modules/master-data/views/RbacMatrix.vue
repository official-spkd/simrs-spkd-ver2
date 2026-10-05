<script setup>
/** MD-10 · Master data — RBAC Matrix */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, DataTable } from '@/components/ui'
import SegTabs from './parts-b/SegTabs.vue'
import AksiHalaman from './parts-b/AksiHalaman.vue'
import { roles, modulRbac, aksiRbac, matriksRbac, catatanRbac } from '../data-b'

// Ubah string "11101" menjadi baris { modul, lihat: true, ... } per role.
const bangun = () =>
  Object.fromEntries(
    roles.map((role) => [
      role,
      modulRbac.map((modul, i) => ({
        id: modul,
        modul,
        ...Object.fromEntries(aksiRbac.map((a, j) => [a.key, matriksRbac[role][i][j] === '1'])),
      })),
    ]),
  )

const matriks = reactive(bangun())
const role = ref(roles[0])
const rows = computed(() => matriks[role.value])
const selected = ref(modulRbac[0])
const berubah = ref(false)
const pesan = ref(null)

const columns = [
  { key: 'modul', label: 'Modul', strong: true },
  ...aksiRbac.map((a) => ({ key: a.key, label: a.label, format: (v) => (v ? 'Ya' : 'Tidak') })),
]

function ubah(row, key, val) {
  row[key] = val
  berubah.value = true
  pesan.value = null
}
function batal() {
  Object.assign(matriks, bangun())
  berubah.value = false
  pesan.value = null
}
function simpan() {
  pesan.value = berubah.value
    ? { tone: 'success', title: 'Hak akses tersimpan', text: `Perubahan role ${role.value} berlaku pada sesi login berikutnya.` }
    : { tone: 'info', title: 'Tidak ada perubahan', text: 'Matriks hak akses sama dengan versi aktif.' }
  berubah.value = false
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <SegTabs v-model="role" :tabs="roles" />

    <UiAlert tone="info" :title="`Role aktif: ${role}`" :text="catatanRbac" />
    <UiAlert v-if="pesan" :tone="pesan.tone" :title="pesan.title" :text="pesan.text" />

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      selectable
      :export-name="`rbac-${role.toLowerCase().replace(/\s+/g, '-')}`"
    >
      <template v-for="a in aksiRbac" :key="a.key" #[`cell-${a.key}`]="{ row, value }">
        <input
          type="checkbox"
          class="rbac__cek"
          :checked="value"
          :disabled="a.key === 'hapus' && row.modul === 'RME'"
          :aria-label="`${a.label} ${row.modul}`"
          @click.stop
          @change="ubah(row, a.key, $event.target.checked)"
        />
      </template>
    </DataTable>

    <AksiHalaman>
      <UiButton @click="batal">Batal</UiButton>
      <UiButton variant="primary" @click="simpan">Simpan hak akses</UiButton>
    </AksiHalaman>
  </div>
</template>

<style scoped>
.rbac__cek { width: 14px; height: 14px; margin: 0; accent-color: var(--c-muted); cursor: pointer; }
.rbac__cek:disabled { cursor: not-allowed; }
</style>
