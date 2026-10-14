<script setup>
/** BLG-02 · Billing — Detail tagihan */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PageHeader, UiAlert, UiButton, DataTable } from '@/components/ui'
import { formatRupiah } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import { getDetail, kategoriRincian } from '../data-a'

const route = useRoute()
const detail = computed(() => getDetail(route.query.id))
const tab = ref('Semua')
const selected = ref(1)
const terkirim = ref(false)

const isBpjs = computed(() => detail.value.penjamin === 'BPJS')
const rows = computed(() =>
  detail.value.items
    .filter((r) => tab.value === 'Semua' || r.kategori === tab.value)
    .map((r) => ({ ...r, perhitungan: r.qty ? `${r.qty} × ${formatRupiah(r.harga)}` : '0', subtotal: r.qty * r.harga })),
)

const columns = [
  { key: 'kategori', label: 'Kategori ▾', strong: true },
  { key: 'item', label: 'Item' },
  { key: 'sumber', label: 'Sumber ↗' },
  { key: 'perhitungan', label: 'Perhitungan' },
  { key: 'subtotal', label: 'Subtotal', format: formatRupiah },
]

// Ringkasan per kategori (urutan sesuai desain)
const urutanRingkasan = ['Admisi', 'Tindakan', 'Obat', 'Penunjang', 'Akomodasi']
const perKategori = computed(() =>
  urutanRingkasan.map((k) => ({
    label: k,
    value: detail.value.items.filter((i) => i.kategori === k).reduce((s, i) => s + i.qty * i.harga, 0),
  })),
)
const total = computed(() => detail.value.items.reduce((s, i) => s + i.qty * i.harga, 0))
const bagian = computed(() =>
  isBpjs.value
    ? [{ label: 'Penjamin BPJS', value: total.value }, { label: 'Bayar pasien', value: 0 }]
    : [{ label: `Penjamin ${detail.value.penjamin}`, value: detail.value.penjamin === 'Umum' ? 0 : total.value }, { label: 'Bayar pasien', value: detail.value.penjamin === 'Umum' ? total.value : 0 }],
)
const statusBadge = computed(() => {
  if (terkirim.value) return { tone: 'success', text: 'BPJS · terkirim ke koding' }
  if (isBpjs.value) return { tone: 'primary', text: 'BPJS · siap koding' }
  return { tone: detail.value.status === 'Lunas' ? 'success' : 'primary', text: `${detail.value.penjamin} · ${detail.value.status.toLowerCase()}` }
})

function kirimKoding() {
  terkirim.value = true
}
function cetak() {
  window.print()
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="detail.pasien" />

    <SegTabs v-model="tab" :tabs="['Semua', ...kategoriRincian]" />

    <div class="row detail__main">
      <div class="stack grow detail__left">
        <DataTable
          v-model:selected="selected"
          :title="`Rincian ${detail.id} · kategori diperluas`"
          :columns="columns"
          :rows="rows"
          selectable
          :export-name="`rincian-${detail.id}`"
        />
        <UiAlert
          v-if="terkirim"
          tone="success"
          title="Terkirim ke Koding"
          :text="`Tagihan ${detail.id} masuk antrean koding INA-CBG · ${formatRupiah(total)}.`"
        />
        <UiAlert
          v-else
          tone="success"
          title="Rincian diverifikasi"
          text="Semua item berasal dari layanan terkait. Koreksi memerlukan alasan dan persetujuan penanggung jawab."
        />
      </div>

      <section class="card detail__sum">
        <h3 class="t-title">Ringkasan tagihan</h3>
        <dl class="sum__list">
          <div v-for="k in perKategori" :key="k.label" class="sum__row">
            <dt>{{ k.label }}</dt>
            <dd>{{ formatRupiah(k.value) }}</dd>
          </div>
        </dl>
        <p class="sum__total">{{ formatRupiah(total) }}</p>
        <dl class="sum__list">
          <div v-for="b in bagian" :key="b.label" class="sum__row">
            <dt>{{ b.label }}</dt>
            <dd>{{ formatRupiah(b.value) }}</dd>
          </div>
        </dl>
        <span class="badge" :class="`badge--${statusBadge.tone}`">{{ statusBadge.text }}</span>
        <UiButton v-if="isBpjs" variant="primary" :disabled="terkirim" @click="kirimKoding">
          {{ terkirim ? 'Terkirim ke Koding' : 'Kirim ke Koding' }}
        </UiButton>
        <UiButton
          v-else-if="detail.status !== 'Lunas'"
          variant="primary"
          :to="{ path: '/billing/pembayaran', query: { id: detail.id } }"
        >
          Proses pembayaran
        </UiButton>
        <UiButton @click="cetak">Cetak rincian</UiButton>
      </section>
    </div>
  </div>
</template>

<style scoped>
.detail__main { align-items: flex-start; }
.detail__left { min-width: 0; }
.detail__sum { width: 300px; flex-shrink: 0; align-items: flex-start; }
.detail__sum .btn { align-self: flex-start; }
.sum__list { margin: 0; width: 100%; display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.sum__row { display: flex; justify-content: space-between; gap: 12px; }
.sum__row dt, .sum__row dd { margin: 0; }
.sum__total { font-size: 28px; font-weight: 600; }
@media (max-width: 1100px) {
  .detail__main { flex-direction: column; }
  .detail__sum { width: 100%; }
}
</style>
