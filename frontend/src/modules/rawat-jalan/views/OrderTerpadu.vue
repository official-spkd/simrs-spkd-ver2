<script setup>
/** RJ-05 · Rawat jalan — Order Terpadu (dialog order di atas workspace pasien) */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiButton, UiModal, FormField, DataTable } from '@/components/ui'
import { useNow, formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import WorkspaceTabs from './parts-a/WorkspaceTabs.vue'
import VitalCards from './parts-a/VitalCards.vue'
import WorkspaceOverview from './parts-a/WorkspaceOverview.vue'
import SegTabs from './parts-a/SegTabs.vue'
import { orderTindakLanjut } from '../data-a'
import { orderSubjudul, orderTabs, katalogOrder, orderTerpilihAwal, ruteObat, waktuPemberian } from '../data-b'

const route = useRoute()
const router = useRouter()
const now = useNow()

const open = ref(true)
const tab = ref(orderTabs.includes(route.query.tab) ? route.query.tab : 'Obat')
const cari = ref('furosemid 40')
const keranjang = ref([...orderTerpilihAwal])
const terpilih = ref(orderTerpilihAwal[0])
const rute = ref('Oral')
const waktu = ref('Pagi setelah makan')
const pin = ref('')
const pinError = ref('')
const orderStatus = ref(orderTindakLanjut.status)
const terkirim = ref('')

const items = computed(() => keranjang.value.map((id) => katalogOrder.find((k) => k.id === id)).filter(Boolean))

// Saran item dari katalog sesuai tab & kata kunci, yang belum ada di keranjang
const saran = computed(() => {
  const q = cari.value.trim().toLowerCase()
  if (!q) return []
  const kata = q.split(/\s+/)
  return katalogOrder.filter(
    (k) =>
      k.jenis === tab.value &&
      !keranjang.value.includes(k.id) &&
      kata.every((w) => `${k.item} ${k.kode}`.toLowerCase().includes(w)),
  )
})

const adaPenisilin = computed(() => items.value.some((i) => i.penisilin))

function tambah(item) {
  keranjang.value.push(item.id)
  terpilih.value = item.id
  cari.value = ''
}

function hapus(id) {
  keranjang.value = keranjang.value.filter((k) => k !== id)
}

function kirim() {
  if (!/^\d{6}$/.test(pin.value)) {
    pinError.value = 'PIN e-Sign 6 digit wajib diisi'
    return
  }
  if (!items.value.length) return
  pinError.value = ''
  const jam = formatJam(now.value)
  orderStatus.value = `ServiceRequest · Terkirim ${jam}`
  terkirim.value = `${items.value.length} item order ditandatangani dan dikirim · ${jam} WIB`
  pin.value = ''
  open.value = false
}

const columns = [
  { key: 'item', label: 'Item', strong: true },
  { key: 'kode', label: 'Kode / dosis' },
  { key: 'aturan', label: 'Aturan' },
  { key: 'jumlah', label: 'Jumlah' },
]
</script>

<template>
  <div class="page">
    <PageHeader />
    <PatientBanner />
    <WorkspaceTabs active="Penilaian" />
    <VitalCards />

    <UiAlert v-if="terkirim" tone="success" title="Order terkirim" :text="terkirim" />

    <WorkspaceOverview
      :order-status="orderStatus"
      @vital-sign="router.push('/rawat-jalan/penilaian-keperawatan')"
      @tambah-order="open = true"
      @tutup-kunjungan="router.push('/rawat-jalan/tutup-kunjungan')"
    />

    <UiModal v-model:open="open" title="Order terpadu" :subtitle="orderSubjudul">
      <SegTabs v-model="tab" :tabs="orderTabs" />

      <FormField label="Cari item / paket / kode">
        <input v-model="cari" class="input" type="search" placeholder="Ketik nama item, paket, atau kode" />
      </FormField>
      <div v-if="saran.length" class="ot__saran">
        <button v-for="s in saran" :key="s.id" type="button" class="ot__opsi" @click="tambah(s)">
          <span class="t-strong">{{ s.item }}</span>
          <span class="t-muted">{{ s.kode }} · {{ s.aturan }}</span>
          <span class="t-primary">+ Tambah</span>
        </button>
      </div>

      <DataTable
        v-model:selected="terpilih"
        :columns="[...columns, { key: 'aksi', label: '', sortable: false, width: '56px' }]"
        :rows="items"
        selectable
        :searchable="false"
        :exportable="false"
        :filterable="false"
        :paginated="false"
        empty-text="Belum ada item order."
      >
        <template #cell-aksi="{ row }">
          <button type="button" class="ot__hapus" :aria-label="`Hapus ${row.item}`" @click.stop="hapus(row.id)">Hapus</button>
        </template>
      </DataTable>

      <div class="ot__fields">
        <FormField label="Rute">
          <select v-model="rute" class="select">
            <option v-for="r in ruteObat" :key="r">{{ r }}</option>
          </select>
        </FormField>
        <FormField label="Waktu pemberian">
          <select v-model="waktu" class="select">
            <option v-for="w in waktuPemberian" :key="w">{{ w }}</option>
          </select>
        </FormField>
        <FormField label="PIN e-Sign" required :error="pinError">
          <input
            v-model="pin"
            class="input"
            :class="{ 'input--error': pinError }"
            type="password"
            inputmode="numeric"
            maxlength="6"
            placeholder="••••••"
            autocomplete="off"
          />
        </FormField>
      </div>

      <UiAlert
        v-if="adaPenisilin"
        tone="danger"
        title="Alergi PENISILIN"
        text="Item terpilih mengandung penisilin. Hapus item atau ganti dengan alternatif sebelum tanda tangan."
      />
      <UiAlert
        v-else
        tone="warning"
        title="Alergi PENISILIN"
        text="Tidak ada penisilin dalam item terpilih. Tetap lakukan telaah klinis sebelum tanda tangan."
      />

      <template #footer>
        <div class="row-between ot__foot">
          <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
          <div class="ot__btns">
            <UiButton @click="open = false">Batal</UiButton>
            <UiButton variant="primary" :disabled="adaPenisilin || !items.length" @click="kirim">Tanda tangan &amp; Kirim</UiButton>
          </div>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.ot__fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.ot__saran {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  overflow: hidden;
  margin-top: -8px;
}
.ot__opsi {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: var(--c-surface);
  border: 0;
  border-bottom: 1px solid var(--c-border);
  font-size: 12px;
  text-align: left;
}
.ot__opsi:last-child { border-bottom: 0; }
.ot__opsi:hover { background: var(--c-primary-soft); }
.ot__opsi .t-muted { flex: 1; }
.ot__hapus { background: none; border: 0; padding: 0; font-size: 11px; color: var(--c-danger); }
.ot__foot { width: 100%; flex-wrap: wrap; }
.ot__btns { display: flex; gap: 8px; }
@media (max-width: 700px) {
  .ot__fields { grid-template-columns: 1fr; }
}
</style>
