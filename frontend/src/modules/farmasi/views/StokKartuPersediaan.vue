<script setup>
/** FRS-05 · Farmasi — Stok & Kartu Persediaan */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiButton, UiAlert, UiCard, UiModal, StatCard, DataTable, BarChart, FormField } from '@/components/ui'
import { formatJam, useNow } from '@/utils/format'
import SegTabs from './parts-a/SegTabs.vue'
import { ringkasanStok, tabStok, stokObat, mutasiStok, drpKlinis, refillKronis, catatanKlinis } from '../data-a'

const now = useNow()
const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)
const tab = ref('Stok')
const permintaan = ref(0)
const hasil = ref(null)

const ringkasan = computed(() =>
  ringkasanStok.map((s) => ({ ...s, value: s.key === 'gudang' ? s.value + permintaan.value : s.value })),
)

/* ---------- Tab Stok ---------- */
const kolomStok = [
  { key: 'obat', label: 'Obat', strong: true },
  { key: 'stok', label: 'Stok' },
  { key: 'minMaks', label: 'Min / maks' },
  { key: 'batchEd', label: 'Batch / ED' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi' },
]
const terpilih = ref(stokObat[0].id)
const obatAktif = computed(() => stokObat.find((o) => o.id === terpilih.value) || stokObat[0])
const grafik = computed(() =>
  obatAktif.value.mutasi.map((m, i, arr) => ({ ...m, highlight: i === arr.length - 1 })),
)

function aksi(row) {
  terpilih.value = row.id
  if (row.aksi === 'Ajukan Gudang') bukaGudang(row)
  else if (row.aksi === 'Tinjau batch')
    hasil.value = { tone: 'warning', title: `Batch ${row.batchEd} ditinjau`, text: `${row.obat} kedaluwarsa ≤90 hari — prioritaskan FEFO atau retur ke gudang.` }
  else hasil.value = { tone: 'info', title: `Kartu stok ${row.obat}`, text: `Grafik mutasi 30 hari menampilkan ${row.obat}.` }
}

/* ---------- Tab lain ---------- */
const kolomMutasi = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'obat', label: 'Obat', strong: true },
  { key: 'jenis', label: 'Jenis mutasi' },
  { key: 'jumlah', label: 'Jumlah', tone: (r) => (r.jumlah.startsWith('+') ? 'success' : 'danger') },
  { key: 'saldo', label: 'Saldo' },
]
const kolomDrp = [
  { key: 'pasien', label: 'Pasien', strong: true },
  { key: 'masalah', label: 'Masalah terkait obat' },
  { key: 'intervensi', label: 'Intervensi' },
  { key: 'status', label: 'Status' },
]
const kolomRefill = [
  { key: 'pasien', label: 'Pasien', strong: true },
  { key: 'obat', label: 'Obat' },
  { key: 'jadwal', label: 'Jadwal refill' },
  { key: 'kontrol', label: 'Jadwal kontrol' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terjadwal' ? 'success' : 'warning') },
]
const drp = ref(drpKlinis.map((d) => ({ ...d })))

/* ---------- Dialog permintaan gudang ---------- */
const gudangOpen = ref(false)
const formGudang = reactive({ obat: '', jumlah: '' })
const errGudang = ref('')

function bukaGudang(row = obatAktif.value) {
  Object.assign(formGudang, { obat: row.obat, jumlah: '' })
  errGudang.value = ''
  gudangOpen.value = true
}
function kirimGudang() {
  if (!(Number(formGudang.jumlah) > 0)) {
    errGudang.value = 'Jumlah harus lebih dari 0.'
    return
  }
  permintaan.value++
  gudangOpen.value = false
  hasil.value = { tone: 'success', title: 'Permintaan gudang terkirim', text: `${formGudang.obat} · ${formGudang.jumlah} unit diajukan ke gudang farmasi.` }
}

/* ---------- Dialog intervensi DRP ---------- */
const drpOpen = ref(false)
const formDrp = reactive({ pasien: '', masalah: '', intervensi: '' })
const errDrp = ref('')

function bukaDrp() {
  Object.assign(formDrp, { pasien: 'Budi Santoso', masalah: '', intervensi: '' })
  errDrp.value = ''
  drpOpen.value = true
}
function simpanDrp() {
  if (!formDrp.masalah.trim() || !formDrp.intervensi.trim()) {
    errDrp.value = 'Masalah dan intervensi wajib diisi.'
    return
  }
  drp.value.unshift({ id: `d${Date.now()}`, ...formDrp, status: 'Dicatat' })
  drpOpen.value = false
  tab.value = 'DRP klinis'
  hasil.value = { tone: 'success', title: 'Intervensi DRP dicatat', text: `${formDrp.pasien} · ${formDrp.masalah}` }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row frs-stats">
      <StatCard v-for="s in ringkasan" :key="s.key" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <SegTabs v-model="tab" :tabs="tabStok" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />

    <DataTable v-if="tab === 'Stok'" v-model:selected="terpilih" :columns="kolomStok" :rows="stokObat" selectable export-name="stok-farmasi">
      <template #cell-aksi="{ row }">
        <button type="button" class="link-aksi" @click.stop="aksi(row)">{{ row.aksi }}</button>
      </template>
    </DataTable>
    <DataTable v-else-if="tab === 'Mutasi 30 hari'" :columns="kolomMutasi" :rows="mutasiStok" export-name="mutasi-30-hari" />
    <DataTable v-else-if="tab === 'DRP klinis'" :columns="kolomDrp" :rows="drp" export-name="drp-klinis" />
    <DataTable v-else :columns="kolomRefill" :rows="refillKronis" export-name="refill-kronis" />

    <div class="row stok-bawah">
      <UiCard class="grow" :title="`Mutasi ${obatAktif.nama} · 30 hari`" :subtitle="`Sumbu Y: ${obatAktif.satuan} · Data simulasi`">
        <BarChart :data="grafik" />
      </UiCard>

      <UiCard class="stok-bawah__side" title="Farmasi klinis">
        <p class="klinis__teks">{{ catatanKlinis }}</p>
        <UiButton class="self-start" @click="bukaDrp">Catat intervensi DRP</UiButton>
        <UiButton variant="primary" class="self-start" @click="bukaGudang()">Ajukan Gudang</UiButton>
      </UiCard>
    </div>

    <UiModal v-model:open="gudangOpen" title="Ajukan Gudang" subtitle="Permintaan stok ke gudang farmasi." width="480px">
      <div class="stack">
        <FormField label="Obat">
          <select v-model="formGudang.obat" class="select">
            <option v-for="o in stokObat" :key="o.id" :value="o.obat">{{ o.obat }}</option>
          </select>
        </FormField>
        <FormField label="Jumlah diminta" required :error="errGudang">
          <input v-model="formGudang.jumlah" class="input" :class="{ 'input--error': errGudang }" type="number" min="1" placeholder="mis. 200" />
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="gudangOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="kirimGudang">Kirim permintaan</UiButton>
      </template>
    </UiModal>

    <UiModal v-model:open="drpOpen" title="Catat intervensi DRP" subtitle="Drug related problem — farmasi klinis." width="520px">
      <div class="stack">
        <FormField label="Pasien">
          <input v-model="formDrp.pasien" class="input" />
        </FormField>
        <FormField label="Masalah terkait obat" required>
          <input v-model="formDrp.masalah" class="input" placeholder="mis. risiko hipokalemia" />
        </FormField>
        <FormField label="Intervensi" required :error="errDrp">
          <textarea v-model="formDrp.intervensi" class="textarea" placeholder="Tindakan / rekomendasi apoteker" />
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="drpOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanDrp">Simpan</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.stok-bawah__side { width: 350px; flex-shrink: 0; }
.klinis__teks { font-size: 14px; }
.self-start { align-self: flex-start; }
.link-aksi { background: none; border: 0; padding: 0; font-size: 12px; color: var(--c-primary); text-align: left; }
.link-aksi:hover { text-decoration: underline; }
@media (max-width: 1100px) {
  .frs-stats { flex-wrap: wrap; }
  .frs-stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .stok-bawah { flex-direction: column; }
  .stok-bawah__side { width: 100%; }
}
</style>
