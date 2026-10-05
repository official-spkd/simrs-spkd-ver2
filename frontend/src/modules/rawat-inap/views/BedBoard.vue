<script setup>
/** RI-01 · Rawat inap — Bed Board */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BedDouble, CircleAlert } from 'lucide-vue-next'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, StatCard, FormField } from '@/components/ui'
import SegmentTabs from './parts-b/SegmentTabs.vue'
import { ringkasanBed, tabBed, statusBed, daftarBed } from '../data-a'

const router = useRouter()
const beds = ref(daftarBed.map((b) => ({ ...b })))
const tab = ref('melati')
const statusFilter = ref('')
const query = ref('')
const selectedId = ref('301-2')
const notice = ref(null)

const toneOf = Object.fromEntries(statusBed.map((s) => [s.key, s.tone]))
const countStatus = (list, s) => list.filter((b) => b.status === s).length

// KPI: nilai dasar + selisih dari perubahan status bed di layar ini
const stats = computed(() => {
  const d = (s) => countStatus(beds.value, s) - countStatus(daftarBed, s)
  const terisi = ringkasanBed.terisi + d('Terisi')
  return [
    { label: 'Bed Melati', value: ringkasanBed.total, note: ringkasanBed.diperbarui },
    { label: 'Terisi', value: terisi, note: `BOR ${Math.round((terisi / ringkasanBed.total) * 100)}%` },
    { label: 'Kosong', value: ringkasanBed.kosong + d('Kosong'), note: ringkasanBed.diperbarui },
    {
      label: 'Booking / bersih',
      value: `${ringkasanBed.booking + d('Booking')} / ${ringkasanBed.bersih + d('Bersih-bersih')}`,
      note: ringkasanBed.diperbarui,
    },
  ]
})

const visibleBeds = computed(() => {
  let list = beds.value
  if (tab.value === 'icu') list = list.filter((b) => b.unit === 'icu')
  if (tab.value === 'cari' && query.value.trim()) {
    const q = query.value.trim().toLowerCase()
    list = list.filter((b) => `${b.id} ${b.status} ${b.pasien?.nama || ''}`.toLowerCase().includes(q))
  }
  if (statusFilter.value) list = list.filter((b) => b.status === statusFilter.value)
  return list
})

// Kartu bed disusun per baris berisi 3
const rows = computed(() => {
  const out = []
  for (let i = 0; i < visibleBeds.value.length; i += 3) out.push(visibleBeds.value.slice(i, i + 3))
  return out
})

const selected = computed(() => beds.value.find((b) => b.id === selectedId.value))
const bedText = (b) => (b.status === 'Terisi' ? b.pasien.nama : b.status === 'Booking' ? `Booking · ${b.pasien.nama}` : b.status)

function toggleStatus(s) {
  statusFilter.value = statusFilter.value === s ? '' : s
}

// Transfer bed
const transferOpen = ref(false)
const tujuan = ref('')
const bedKosong = computed(() => beds.value.filter((b) => b.status === 'Kosong'))
function bukaTransfer() {
  tujuan.value = bedKosong.value[0]?.id || ''
  transferOpen.value = true
}
function simpanTransfer() {
  const asal = selected.value
  const target = beds.value.find((b) => b.id === tujuan.value)
  if (!asal || !target) return
  target.status = 'Terisi'
  target.pasien = asal.pasien
  asal.status = 'Bersih-bersih'
  asal.pasien = null
  transferOpen.value = false
  notice.value = { tone: 'success', title: `Pasien dipindah ke bed ${target.id}`, text: `Bed ${asal.id} ditandai bersih-bersih.` }
  selectedId.value = target.id
}

function tandaiBersih() {
  selected.value.status = 'Kosong'
  notice.value = { tone: 'success', title: `Bed ${selected.value.id} siap dipakai`, text: 'Status bed berubah menjadi kosong.' }
}
function konfirmasiBooking() {
  selected.value.status = 'Terisi'
  notice.value = { tone: 'success', title: `${selected.value.pasien.nama} masuk bed ${selected.value.id}`, text: 'Booking dikonfirmasi.' }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row bb__stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <UiAlert v-if="notice" :tone="notice.tone" :title="notice.title" :text="notice.text">
      <template #actions><UiButton size="sm" variant="ghost" @click="notice = null">Tutup</UiButton></template>
    </UiAlert>

    <div class="row bb__main">
      <div class="grow stack">
        <SegmentTabs v-model="tab" :tabs="tabBed" />

        <input v-if="tab === 'cari'" v-model="query" class="input" type="search" placeholder="Cari nomor bed atau nama pasien…" aria-label="Cari bed" />

        <div v-for="(r, i) in rows" :key="i" class="bb__grid">
          <button
            v-for="b in r"
            :key="b.id"
            type="button"
            class="bed"
            :class="[`bed--${toneOf[b.status]}`, { 'is-selected': b.id === selectedId }]"
            :aria-pressed="b.id === selectedId"
            @click="selectedId = b.id"
          >
            <BedDouble class="bed__icon" :width="40" :height="40" :stroke-width="1.5" aria-hidden="true" />
            <span class="bed__id">{{ b.id }}</span>
            <span class="bed__text">{{ bedText(b) }}</span>
            <UiBadge :tone="toneOf[b.status]">{{ b.status }}</UiBadge>
          </button>
          <span v-for="n in 3 - r.length" :key="`pad${n}`" class="bed__pad" aria-hidden="true" />
        </div>
        <p v-if="!visibleBeds.length" class="t-sm t-muted">Tidak ada bed yang cocok.</p>

        <div class="row bb__legend">
          <button v-for="s in statusBed" :key="s.key" type="button" class="bb__legend-btn" :class="{ 'is-off': statusFilter && statusFilter !== s.key }" :title="`Saring: ${s.key}`" @click="toggleStatus(s.key)">
            <UiBadge :tone="s.tone">{{ s.key }}</UiBadge>
          </button>
        </div>
      </div>

      <UiCard v-if="selected" class="bb__side" :title="`Bed terpilih · ${selected.id}`">
        <template v-if="selected.pasien">
          <p class="t-lg">{{ selected.pasien.nama }}</p>
          <p>{{ selected.pasien.identitas }}</p>
          <p>{{ selected.pasien.rawat }}</p>
          <UiAlert v-if="selected.pasien.alergi" tone="danger" :icon="CircleAlert" :title="selected.pasien.alergi" />
          <template v-if="selected.status === 'Terisi'">
            <UiButton class="bb__btn" variant="primary" to="/rawat-inap/workspace-ranap">Detail pasien</UiButton>
            <UiButton class="bb__btn" :disabled="!bedKosong.length" @click="bukaTransfer">Transfer bed</UiButton>
          </template>
          <template v-else>
            <UiButton class="bb__btn" variant="primary" @click="konfirmasiBooking">Konfirmasi masuk</UiButton>
            <UiButton class="bb__btn" to="/rawat-inap/admisi-ranap">Buka admisi</UiButton>
          </template>
        </template>
        <template v-else>
          <p class="t-lg">{{ selected.status === 'Kosong' ? 'Bed kosong' : 'Sedang dibersihkan' }}</p>
          <p class="t-muted">{{ selected.status === 'Kosong' ? 'Bed siap menerima pasien baru.' : 'Bed belum dapat dipakai sampai pembersihan selesai.' }}</p>
          <UiButton v-if="selected.status === 'Kosong'" class="bb__btn" variant="primary" @click="router.push('/rawat-inap/admisi-ranap')">Admisi pasien</UiButton>
          <UiButton v-else class="bb__btn" variant="primary" @click="tandaiBersih">Tandai bersih</UiButton>
        </template>
      </UiCard>
    </div>

    <UiModal v-model:open="transferOpen" title="Transfer bed" :subtitle="selected?.pasien ? `${selected.pasien.nama} · dari ${selected.id}` : ''" width="480px">
      <FormField label="Bed tujuan" required>
        <select v-model="tujuan" class="select">
          <option v-for="b in bedKosong" :key="b.id" :value="b.id">{{ b.id }}</option>
        </select>
      </FormField>
      <template #footer>
        <UiButton @click="transferOpen = false">Batal</UiButton>
        <UiButton variant="primary" :disabled="!tujuan" @click="simpanTransfer">Pindahkan</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.bb__side { width: 300px; flex-shrink: 0; }
.bb__side p { font-size: 14px; }
.bb__side p.t-lg { font-size: 22px; }
.bb__btn { align-self: flex-start; }
.bb__grid { display: flex; gap: 16px; width: 100%; }
.bed {
  flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 18px;
  padding: 24px; border: 1px solid; border-radius: var(--r-md); text-align: left; font: inherit; color: var(--c-text);
  transition: box-shadow 0.15s;
}
.bed:hover { box-shadow: 0 2px 8px rgba(16, 45, 80, 0.08); }
.bed.is-selected { box-shadow: 0 0 0 3px var(--c-primary-tint); }
.bed__pad { flex: 1 1 0; min-width: 0; }
.bed__icon { flex-shrink: 0; }
.bed__id { font-size: 24px; font-weight: 600; line-height: 1.45; }
.bed__text { font-size: 14px; line-height: 1.45; }
.bed--success { background: var(--c-success-soft); border-color: var(--c-success); }
.bed--success .bed__icon { color: var(--c-success); }
.bed--primary { background: var(--c-primary-soft); border-color: var(--c-primary); }
.bed--primary .bed__icon { color: var(--c-primary); }
.bed--warning { background: var(--c-warning-soft); border-color: var(--c-warning); }
.bed--warning .bed__icon { color: var(--c-warning); }
.bed--danger { background: var(--c-danger-soft); border-color: var(--c-danger); }
.bed--danger .bed__icon { color: var(--c-danger); }
.bb__legend { flex-wrap: wrap; }
.bb__legend-btn { background: none; border: 0; padding: 0; }
.bb__legend-btn.is-off { opacity: 0.45; }
@media (max-width: 1100px) {
  .bb__stats { flex-wrap: wrap; }
  .bb__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .bb__main { flex-direction: column; }
  .bb__side { width: 100%; }
}
@media (max-width: 640px) {
  .bb__grid { flex-direction: column; }
  .bed__pad { display: none; }
}
</style>
