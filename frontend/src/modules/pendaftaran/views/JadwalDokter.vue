<script setup>
/** PDR-07 · Pendaftaran — Jadwal Dokter */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, DataTable, FormField } from '@/components/ui'
import StepTabs from './parts-a/StepTabs.vue'
import { tampilanJadwal, opsiPoliJadwal, periodeJadwal, hariIniJadwal, jadwalMingguan } from '../data-b'

const tampilan = ref('minggu')
const poli = ref(opsiPoliJadwal[0])
const minggu = reactive(jadwalMingguan.map((h) => ({ ...h, slot: h.slot.map((s) => ({ ...s })) })))
const terpilihId = ref(`${hariIniJadwal}-0`)
const pesan = ref('')

const semuaSlot = computed(() => minggu.flatMap((h) => h.slot.map((s) => ({ ...s, hari: h }))))
const terpilih = computed(() => semuaSlot.value.find((s) => s.id === terpilihId.value))
const hariIni = computed(() => minggu.find((h) => h.key === hariIniJadwal))

const label = (s) => (s.tampilSisa ? `${s.terisi}/${s.kuota} terisi · sisa ${s.kuota - s.terisi}` : `${s.terisi}/${s.kuota} terisi`)
const ringkas = computed(() => {
  const s = terpilih.value
  if (!s) return ''
  return s.jenis === 'cuti' ? 'Cuti / blok' : `${s.terisi}/${s.kuota} terisi · sisa ${s.kuota - s.terisi}`
})

// Tampilan "Dokter": rekap per dokter selama sepekan
const rekapDokter = computed(() => {
  const map = {}
  semuaSlot.value.forEach((s) => {
    const r = (map[s.dokter] ??= { id: s.dokter, dokter: s.dokter, jam: s.jamAsli || s.jam, praktik: 0, cuti: 0, terisi: 0, kuota: 0 })
    if (s.jenis === 'cuti') r.cuti++
    else {
      r.praktik++
      r.terisi += s.terisi
      r.kuota += s.kuota
    }
  })
  return Object.values(map).map((r) => ({ ...r, kuotaText: `${r.terisi}/${r.kuota} terisi` }))
})
const kolomDokter = [
  { key: 'dokter', label: 'Dokter', strong: true },
  { key: 'jam', label: 'Jam praktik' },
  { key: 'praktik', label: 'Hari praktik' },
  { key: 'cuti', label: 'Cuti / blok', tone: (r) => (r.cuti ? 'warning' : null) },
  { key: 'kuotaText', label: 'Kuota pekan ini' },
]

// Tambah jadwal (dialog)
const tambahOpen = ref(false)
const baru = reactive({ hari: 'sen', jam: '16.00–18.00', dokter: '', jenis: 'sore', kuota: 15 })
const dicoba = ref(false)
const errBaru = computed(() => ({
  dokter: !baru.dokter.trim() ? 'Nama dokter wajib diisi' : '',
  jam: !/^\d{2}\.\d{2}–\d{2}\.\d{2}$/.test(baru.jam.trim()) ? 'Format jam: 16.00–18.00' : '',
  kuota: !(Number(baru.kuota) > 0) ? 'Kuota minimal 1' : '',
}))
function simpanJadwal() {
  dicoba.value = true
  if (Object.values(errBaru.value).some(Boolean)) return
  const h = minggu.find((x) => x.key === baru.hari)
  const id = `${h.key}-${h.slot.length}`
  h.slot.push({ id, jam: baru.jam.trim(), dokter: baru.dokter.trim(), jenis: baru.jenis, terisi: 0, kuota: Number(baru.kuota), tampilSisa: true })
  terpilihId.value = id
  pesan.value = `Jadwal ${baru.dokter.trim()} ${h.nama} ${baru.jam.trim()} ditambahkan.`
  tambahOpen.value = false
  dicoba.value = false
  baru.dokter = ''
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <StepTabs v-model="tampilan" :tabs="tampilanJadwal" />

    <div class="row-center jd__filter">
      <label class="jd__poli badge badge--primary">
        <select v-model="poli" aria-label="Poli">
          <option v-for="p in opsiPoliJadwal" :key="p">{{ p }}</option>
        </select>
      </label>
      <UiBadge v-if="terpilih" :tone="terpilih.jenis === 'cuti' ? 'warning' : 'success'">{{ ringkas }}</UiBadge>
      <UiButton @click="tambahOpen = true">Tambah jadwal</UiButton>
    </div>

    <UiAlert v-if="pesan" tone="success" :title="pesan">
      <template #actions><UiButton size="sm" variant="ghost" @click="pesan = ''">Tutup</UiButton></template>
    </UiAlert>

    <!-- Minggu -->
    <UiCard v-if="tampilan === 'minggu'" :title="periodeJadwal">
      <div class="jd__scroll">
        <div class="jd__week">
          <div v-for="h in minggu" :key="h.key" class="jd__day">
            <p class="jd__dayname" :class="{ 'is-today': h.key === hariIniJadwal }">{{ h.label }}</p>
            <button
              v-for="s in h.slot"
              :key="s.id"
              type="button"
              class="jd__blok"
              :class="[`jd__blok--${s.jenis}`, { 'is-selected': s.id === terpilihId }]"
              @click="terpilihId = s.id"
            >
              <span class="jd__jam">{{ s.jam }}</span>
              <span class="jd__dokter">{{ s.dokter }}</span>
              <span class="jd__kuota">{{ label(s) }}</span>
            </button>
          </div>
        </div>
      </div>
      <p class="t-xs t-muted">Biru: poli / pagi · Hijau: visite / sore · Kuning: cuti atau konflik</p>
    </UiCard>

    <!-- Hari -->
    <UiCard v-else-if="tampilan === 'hari'" :title="`${hariIni.nama}, 14 Mei 2025`">
      <div class="grid-3">
        <button
          v-for="s in hariIni.slot"
          :key="s.id"
          type="button"
          class="jd__blok"
          :class="[`jd__blok--${s.jenis}`, { 'is-selected': s.id === terpilihId }]"
          @click="terpilihId = s.id"
        >
          <span class="jd__jam">{{ s.jam }}</span>
          <span class="jd__dokter">{{ s.dokter }}</span>
          <span class="jd__kuota">{{ label(s) }}</span>
        </button>
      </div>
      <p class="t-xs t-muted">Biru: poli / pagi · Hijau: visite / sore · Kuning: cuti atau konflik</p>
    </UiCard>

    <!-- Dokter -->
    <DataTable
      v-else
      :title="`Dokter ${poli} · ${periodeJadwal}`"
      :columns="kolomDokter"
      :rows="rekapDokter"
      :paginated="false"
      export-name="jadwal-dokter"
    />

    <UiAlert
      tone="warning"
      title="Jadwal aktif digunakan untuk booking"
      text="Blok cuti dr. Ratna Jumat 11.00–13.00 tidak dapat dipilih untuk kunjungan."
    />

    <UiModal v-model:open="tambahOpen" title="Tambah jadwal" :subtitle="`${poli} · ${periodeJadwal}`" width="560px">
      <div class="grid-2">
        <FormField label="Hari" required>
          <select v-model="baru.hari" class="select">
            <option v-for="h in minggu" :key="h.key" :value="h.key">{{ h.label }}</option>
          </select>
        </FormField>
        <FormField label="Jam" required :error="dicoba ? errBaru.jam : ''">
          <input v-model="baru.jam" class="input" />
        </FormField>
        <FormField label="Dokter" required :error="dicoba ? errBaru.dokter : ''">
          <input v-model="baru.dokter" class="input" placeholder="dr. …" />
        </FormField>
        <FormField label="Kuota" required :error="dicoba ? errBaru.kuota : ''">
          <input v-model="baru.kuota" class="input" type="number" min="1" />
        </FormField>
        <FormField label="Jenis">
          <select v-model="baru.jenis" class="select">
            <option value="pagi">Poli / pagi</option>
            <option value="sore">Visite / sore</option>
            <option value="cuti">Cuti / blok</option>
          </select>
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="tambahOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanJadwal">Simpan jadwal</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.jd__filter { flex-wrap: wrap; }
.jd__poli { padding: 0; }
.jd__poli select {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 4px 9px;
  cursor: pointer;
}
.jd__scroll { overflow-x: auto; }
.jd__week { display: flex; gap: 8px; min-width: 760px; }
.jd__day { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.jd__dayname { font-size: 12px; font-weight: 600; color: var(--c-muted); text-align: center; }
.jd__dayname.is-today { color: var(--c-primary); }
.jd__blok {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-height: 112px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  text-align: left;
  color: var(--c-text);
  line-height: 1.45;
}
.jd__blok--pagi { background: var(--c-primary-soft); }
.jd__blok--sore { background: var(--c-success-soft); }
.jd__blok--cuti { background: var(--c-warning-soft); }
.jd__blok.is-selected { border-color: var(--c-primary); }
.jd__jam { font-size: 12px; font-weight: 600; }
.jd__dokter { font-size: 11px; }
.jd__kuota { font-size: 10px; color: var(--c-muted); }
@media (max-width: 720px) {
  .grid-2,
  .grid-3 { grid-template-columns: 1fr; }
}
</style>
