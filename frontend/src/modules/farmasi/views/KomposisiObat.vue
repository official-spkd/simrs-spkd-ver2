<script setup>
/** FRS-03 · Farmasi — Komposisi Obat */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiButton, UiAlert, UiCard, DataTable } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienResep, itemResep, langkahResep, scanAwal, checklist6R } from '../data-a'

const router = useRouter()

// Langkah alur resep: tab aktif = Komposisi, tab lain berpindah layar
const langkah = langkahResep.map((l) => l.label)
function keLangkah(label) {
  const l = langkahResep.find((x) => x.label === label)
  if (l) router.push(l.to)
}

/* ---------- Scan barcode ---------- */
const terscan = reactive({ ...scanAwal })
const barcode = ref('899-DEMO-FUR40')
const pesanScan = ref({ tone: 'success', text: '✓ Furosemid 40 mg cocok dengan resep' })
const terpilih = ref(itemResep[0].id)

function scan() {
  const kode = barcode.value.trim().toUpperCase()
  const item = itemResep.find((i) => i.barcode === kode || i.batch === kode)
  if (!item) {
    pesanScan.value = { tone: 'danger', text: '✕ Barcode tidak cocok dengan item resep' }
    return
  }
  terscan[item.id] = item.qty
  terpilih.value = item.id
  pesanScan.value = { tone: 'success', text: `✓ ${item.obat} cocok dengan resep` }
}

const baris = computed(() =>
  itemResep.map((i) => ({
    ...i,
    jumlahScan: `${terscan[i.id]} / ${i.qty}`,
    hasil: terscan[i.id] >= i.qty ? '✓ Cocok' : 'Menunggu scan',
  })),
)
const kolom = [
  { key: 'obat', label: 'Item resep', strong: true },
  { key: 'batch', label: 'Barcode / batch' },
  { key: 'jumlahScan', label: 'Jumlah' },
  { key: 'ed', label: 'Kedaluwarsa' },
  { key: 'hasil', label: 'Hasil scan', tone: (r) => (r.hasil === '✓ Cocok' ? 'success' : 'warning') },
]
const itemLabel = computed(() => itemResep.find((i) => i.id === terpilih.value) || itemResep[0])

/* ---------- 6R & penyelesaian ---------- */
const enamR = reactive(checklist6R.map((c) => ({ ...c })))
const hasil = ref(null)

function cetakEtiket() {
  hasil.value = { tone: 'info', title: 'Etiket dikirim ke printer', text: `${itemLabel.value.obat} · ${pasienResep.nama}` }
}

function selesai() {
  const belumScan = baris.value.filter((b) => b.hasil !== '✓ Cocok').map((b) => b.obat)
  if (belumScan.length) {
    hasil.value = { tone: 'warning', title: 'Item belum dipindai', text: `Scan barcode: ${belumScan.join(', ')}.` }
    return
  }
  const belum6R = enamR.filter((c) => !c.done).map((c) => c.label)
  if (belum6R.length) {
    hasil.value = { tone: 'warning', title: '6R belum lengkap', text: `Belum dicentang: ${belum6R.join(', ')}.` }
    return
  }
  router.push('/farmasi/serah-terima')
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienResep" />

    <SegTabs model-value="2 Komposisi" :tabs="langkah" @update:model-value="keLangkah" />

    <label class="scan">
      <span class="scan__label">Scan barcode obat · fokus scanner</span>
      <input v-model="barcode" class="input" autofocus @keydown.enter.prevent="scan" />
      <span class="scan__hint" :class="`t-${pesanScan.tone}`">{{ pesanScan.text }}</span>
    </label>

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <DataTable v-model:selected="terpilih" :columns="kolom" :rows="baris" selectable export-name="komposisi-rx-demo-007" />

    <div class="row komposisi">
      <UiCard class="grow" title="6R keselamatan">
        <CheckList :items="enamR" />
      </UiCard>

      <UiCard class="komposisi__label" title="Label obat">
        <p class="t-strong label__pasien">{{ pasienResep.nama }} · RM {{ pasienResep.rm }}</p>
        <p class="label__teks">{{ itemLabel.label }}</p>
        <p class="t-sm t-danger">Alergi PENISILIN</p>
        <UiButton class="self-start" @click="cetakEtiket">Cetak etiket</UiButton>
      </UiCard>
    </div>

    <div class="row-between aksi">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row aksi__btn">
        <UiButton to="/farmasi/telaah-resep">Kembali</UiButton>
        <UiButton variant="primary" @click="selesai">Selesai komposisi</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.scan__label { font-size: 12px; font-weight: 600; color: var(--c-muted); }
.scan__hint { font-size: 11px; }
.komposisi__label { width: 380px; flex-shrink: 0; }
.label__pasien, .label__teks { font-size: 14px; }
.self-start { align-self: flex-start; }
.aksi { align-items: center; gap: 12px; flex-wrap: wrap; }
.aksi__btn { gap: 8px; }
@media (max-width: 1100px) {
  .komposisi { flex-direction: column; }
  .komposisi__label { width: 100%; }
}
</style>
