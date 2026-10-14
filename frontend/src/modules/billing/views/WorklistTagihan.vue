<script setup>
/** BLG-01 · Billing — Worklist tagihan */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, StatCard, DataTable } from '@/components/ui'
import { formatJam, formatRupiah, useNow } from '@/utils/format'
import SegTabs from './parts-a/SegTabs.vue'
import { tagihan, tabWorklist, ringkasanWorklist } from '../data-a'

const router = useRouter()
const now = useNow()
const tab = ref('Siap bayar')
const selected = ref('INV-007')
const tableEl = ref(null)

const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)

// "Siap bayar" = antrian kasir aktif (belum lunas); tab lain memfilter status.
const filter = {
  'Siap bayar': (r) => r.status !== 'Lunas',
  'Belum final': (r) => r.status === 'Belum final',
  Lunas: (r) => r.status === 'Lunas',
  'BPJS ke koding': (r) => r.status === 'Siap koding',
}
const rows = computed(() => tagihan.filter(filter[tab.value]))

const columns = [
  { key: 'id', label: 'Tagihan', strong: true },
  { key: 'pasien', label: 'Pasien / NIK' },
  { key: 'unit', label: 'Unit' },
  { key: 'penjamin', label: 'Penjamin' },
  { key: 'total', label: 'Total', format: formatRupiah },
  { key: 'status', label: 'Status' },
]

// Klik baris → buka rincian tagihan (BLG-02).
function buka(row) {
  selected.value = row.id
  router.push({ path: '/billing/detail-tagihan', query: { id: row.id } })
}

// Pintasan keyboard kasir: F2 cari · F6 pembayaran · F8 kwitansi · Enter konfirmasi
function onKey(e) {
  if (e.key === 'F2') {
    e.preventDefault()
    tableEl.value?.$el.querySelector('input[type="search"]')?.focus()
  } else if (e.key === 'F6') {
    e.preventDefault()
    router.push({ path: '/billing/pembayaran', query: { id: selected.value } })
  } else if (e.key === 'F8') {
    e.preventDefault()
    router.push({ path: '/billing/kwitansi', query: { id: selected.value } })
  } else if (e.key === 'Enter' && e.target === document.body) {
    buka(tagihan.find((r) => r.id === selected.value))
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row worklist__stats">
      <StatCard v-for="s in ringkasanWorklist" :key="s.label" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <SegTabs v-model="tab" :tabs="tabWorklist" />

    <DataTable
      ref="tableEl"
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      selectable
      export-name="worklist-tagihan"
      @row-click="buka"
    />

    <UiAlert
      tone="info"
      title="Kasir · scanner & keyboard siap"
      text="F2 cari tagihan · F6 pembayaran · F8 cetak kwitansi · Enter konfirmasi"
    />
  </div>
</template>

<style scoped>
@media (max-width: 1100px) {
  .worklist__stats { flex-wrap: wrap; }
  .worklist__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
}
</style>
