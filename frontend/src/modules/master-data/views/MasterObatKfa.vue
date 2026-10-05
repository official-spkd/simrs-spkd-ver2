<script setup>
/** MD-08 · Master data — Master Obat & KFA */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, UiModal, StatCard, FormField, DataTable } from '@/components/ui'
import AksiHalaman from './parts-b/AksiHalaman.vue'
import { ringkasanObat, obat, katalogKfa, catatanKfa } from '../data-b'

const daftar = reactive(obat)
const selected = ref(daftar[0].id)
const pesan = ref('')

const columns = [
  { key: 'nama', label: 'Obat', strong: true },
  { key: 'bentuk', label: 'Bentuk' },
  { key: 'kekuatan', label: 'Kekuatan' },
  { key: 'kfa', label: 'KFA' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terkirim' ? 'success' : 'warning') },
]

// Dialog Pemetaan KFA
const modal = ref(false)
const aktif = ref(null)
const cari = ref('')
const pilihan = ref('')

// Kata kunci awal: kata pertama nama obat + angka kekuatan (mis. "furosemid 40").
const kataKunci = (o) => `${o.nama.split(' ')[0]} ${o.kekuatan.split(' ')[0]}`.toLowerCase()

const hasil = computed(() => {
  const kata = cari.value.toLowerCase().split(/\s+/).filter(Boolean)
  // Cocok bila kata pertama ada di nama/kode; kata berikutnya hanya mempersempit bila cocok.
  const dasar = katalogKfa.filter((k) => !kata.length || `${k.kode} ${k.nama}`.toLowerCase().includes(kata[0]))
  return dasar.length ? dasar : katalogKfa
})

function bukaPemetaan(o) {
  aktif.value = o
  cari.value = kataKunci(o)
  pilihan.value = o.kfa.startsWith('KFA') ? o.kfa : (hasil.value[0]?.kode ?? '')
  modal.value = true
}
function simpanPemetaan() {
  if (!pilihan.value) return
  Object.assign(aktif.value, { kfa: pilihan.value, status: 'Terkirim' })
  modal.value = false
  pesan.value = `${aktif.value.nama} ${aktif.value.kekuatan} dipetakan ke ${pilihan.value}.`
}

// Obat baru — masuk antrian pemetaan KFA
const modalBaru = ref(false)
const baru = reactive({ nama: '', bentuk: 'Tablet', kekuatan: '' })
const errBaru = ref('')
function bukaBaru() {
  Object.assign(baru, { nama: '', bentuk: 'Tablet', kekuatan: '' })
  errBaru.value = ''
  modalBaru.value = true
}
function simpanBaru() {
  if (!baru.nama.trim() || !baru.kekuatan.trim()) return (errBaru.value = 'Nama obat dan kekuatan wajib diisi')
  const o = { id: `O-${Date.now()}`, nama: baru.nama.trim(), bentuk: baru.bentuk, kekuatan: baru.kekuatan.trim(), kfa: 'Belum dipilih', status: 'Antrian' }
  daftar.push(o)
  selected.value = o.id
  modalBaru.value = false
  bukaPemetaan(o)
}
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" @click="bukaBaru">+ Baru</UiButton>
    </PageHeader>

    <div class="row md-stats">
      <StatCard v-for="s in ringkasanObat" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <UiAlert v-if="pesan" tone="success" title="Pemetaan KFA tersimpan" :text="pesan" />

    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="daftar"
      selectable
      export-name="master-obat-kfa"
      @row-click="bukaPemetaan"
    />

    <UiModal v-model:open="modal" title="Pemetaan KFA">
      <p class="t-body t-muted">Obat lokal: {{ aktif?.nama }} {{ aktif?.kekuatan }} {{ aktif?.bentuk.toLowerCase() }} · pilih konsep yang sesuai.</p>
      <FormField label="Cari nama / kode KFA">
        <input v-model="cari" class="input" />
      </FormField>

      <div class="kfa card card--flush" role="radiogroup" aria-label="Pilihan KFA">
        <div class="kfa__head">
          <span>Pilihan KFA ↕</span><span>Bentuk ↕</span><span>Kekuatan ↕</span>
        </div>
        <label
          v-for="k in hasil"
          :key="k.kode"
          class="kfa__row"
          :class="{ 'is-selected': pilihan === k.kode }"
        >
          <span class="t-strong kfa__nama">
            <input v-model="pilihan" type="radio" name="kfa" :value="k.kode" />
            {{ k.kode }} · {{ k.nama }}
          </span>
          <span>{{ k.bentuk }}</span>
          <span>{{ k.kekuatan }}</span>
        </label>
      </div>

      <UiAlert tone="info" :title="catatanKfa.title" :text="catatanKfa.text" />

      <AksiHalaman>
        <UiButton @click="modal = false">Batal</UiButton>
        <UiButton variant="primary" :disabled="!pilihan" @click="simpanPemetaan">Simpan pemetaan</UiButton>
      </AksiHalaman>
    </UiModal>

    <UiModal v-model:open="modalBaru" title="Obat baru" subtitle="Obat baru masuk antrian pemetaan KFA.">
      <div class="grid-3 md-obat">
        <FormField label="Nama obat" required :error="errBaru">
          <input v-model="baru.nama" class="input" />
        </FormField>
        <FormField label="Bentuk">
          <select v-model="baru.bentuk" class="select">
            <option v-for="b in ['Tablet', 'Kapsul', 'Sirup', 'Injeksi', 'Infus', 'Salep']" :key="b">{{ b }}</option>
          </select>
        </FormField>
        <FormField label="Kekuatan" required>
          <input v-model="baru.kekuatan" class="input" placeholder="mis. 500 mg" />
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="modalBaru = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanBaru">Simpan &amp; petakan</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.kfa__head,
.kfa__row { display: flex; gap: 12px; padding: 12px 16px; }
.kfa__head > span,
.kfa__row > span { flex: 1 1 0; min-width: 0; }
.kfa__head { background: var(--c-bg); font-size: 11px; font-weight: 600; color: var(--c-muted); }
.kfa__row { padding: 15px 16px; font-size: 12px; border-bottom: 1px solid var(--c-border); cursor: pointer; }
.kfa__row:last-child { border-bottom: 0; }
.kfa__row.is-selected { background: var(--c-primary-soft); }
.kfa__nama { display: flex; align-items: center; gap: 6px; }
.kfa__nama input { accent-color: var(--c-text); margin: 0; }
@media (max-width: 900px) {
  .md-stats { flex-wrap: wrap; }
  .md-stats > :deep(.stat) { flex-basis: 100%; }
  .md-obat { grid-template-columns: minmax(0, 1fr); }
}
</style>
