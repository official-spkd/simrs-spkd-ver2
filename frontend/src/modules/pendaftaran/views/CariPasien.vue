<script setup>
/** PDR-02 · Pendaftaran — Cari Pasien (dialog di atas worklist) */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiButton, UiModal, DataTable, FormField } from '@/components/ui'
import WorklistLoket from './parts-a/WorklistLoket.vue'
import { pasienTerdaftar } from '../data-a'

const route = useRoute()
const router = useRouter()

const open = ref(true)
const q = ref(String(route.query.q ?? 'Budi'))
const selected = ref(null)

const hasil = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return []
  return pasienTerdaftar
    .filter((p) => [p.rm, p.nik, p.nama].some((v) => v.toLowerCase().includes(k)))
    .map((p) => ({ ...p, rmNik: `${p.rm} / ${p.nik}`, pasien: `${p.nama} · ${p.umur} th` }))
})
// Pilih otomatis hasil pertama
watch(hasil, (h) => (selected.value = h[0]?.id ?? null), { immediate: true })
const terpilih = computed(() => hasil.value.find((p) => p.id === selected.value))

const columns = [
  { key: 'rmNik', label: 'RM / NIK', strong: true },
  { key: 'pasien', label: 'Pasien' },
  { key: 'dukcapil', label: 'Dukcapil' },
  { key: 'ihs', label: 'IHS', tone: (r) => (r.ihs.startsWith('✓') ? null : 'warning') },
]

function bukaDialog(kata) {
  if (kata) q.value = kata
  open.value = true
}
function pilih() {
  if (!terpilih.value) return
  router.push({ path: '/pendaftaran/form-kunjungan', query: { id: terpilih.value.id } })
}
</script>

<template>
  <div class="page">
    <PageHeader />
    <WorklistLoket @cari="bukaDialog" />

    <UiModal v-model:open="open" title="Cari pasien">
      <FormField
        label="NIK / RM / Nama"
        :hint="hasil.length ? '' : 'Tidak ada pasien yang cocok · daftarkan sebagai pasien baru'"
      >
        <input v-model="q" class="input" type="search" autofocus @keydown.enter="pilih" />
        <span v-if="hasil.length" class="cp__found">{{ hasil.length }} hasil sesuai pencarian · Enter untuk memilih</span>
      </FormField>

      <DataTable
        v-if="hasil.length"
        v-model:selected="selected"
        :columns="columns"
        :rows="hasil"
        selectable
        :searchable="false"
        :exportable="false"
        :filterable="false"
        :paginated="false"
      />

      <UiAlert tone="info" title="Pastikan dua identitas cocok" text="Konfirmasi nama dan tanggal lahir sebelum membuat kunjungan." />

      <template #footer>
        <div class="cp__foot">
          <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
          <div class="row gap-8">
            <UiButton @click="open = false">Tutup</UiButton>
            <UiButton v-if="terpilih" variant="primary" @click="pilih">Pilih {{ terpilih.nama }}</UiButton>
            <UiButton v-else variant="primary" to="/pendaftaran/form-pasien-baru">+ Pasien Baru</UiButton>
          </div>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.cp__found { font-size: 11px; color: var(--c-success); }
.cp__foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; flex-wrap: wrap; }
</style>
