<script setup>
/** IGD-01 · IGD — Tracking Board */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiButton, UiBadge, UiAlert, StatCard, UiModal, FormField } from '@/components/ui'
import { formatJam, useNow } from '@/utils/format'
import { ringkasanIgd, kolomProses, pasienBoard } from '../data-a'

const now = useNow()
const pasien = ref(pasienBoard.map((p) => ({ ...p })))
const tambahan = ref(0)

const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)
const ringkasan = computed(() =>
  ringkasanIgd.map((s) => ({ ...s, value: s.key === 'aktif' ? s.value + tambahan.value : s.value })),
)
const perKolom = computed(() =>
  Object.fromEntries(kolomProses.map((k) => [k.key, pasien.value.filter((p) => p.kolom === k.key)])),
)
const sementara = computed(() => pasien.value.filter((p) => p.sementara))

// Tautan detail sesuai tahap: triase → form triase, selesai → outcome, lainnya → CPPT
function detailTo(p) {
  const path = p.kolom === 'triase' ? '/igd/form-triase' : p.kolom === 'selesai' ? '/igd/outcome-igd' : '/igd/cppt-igd'
  return { path, query: { id: p.id } }
}

/* ---------- Dialog pasien baru ---------- */
const modalOpen = ref(false)
const form = reactive({ nama: '', nik: '', keluhan: '' })
const error = ref('')
const sukses = ref('')

function bukaModal() {
  Object.assign(form, { nama: '', nik: '', keluhan: '' })
  error.value = ''
  modalOpen.value = true
}

function simpanPasien() {
  if (!form.keluhan.trim()) {
    error.value = 'Keluhan utama wajib diisi.'
    return
  }
  const urut = String(pasien.value.filter((p) => p.sementara).length + 1).padStart(3, '0')
  const tanpaNik = !form.nik.trim()
  const nama = form.nama.trim() || `Unknown-${Number(urut)}`
  pasien.value.unshift({
    id: tanpaNik ? `TMP-${urut}` : form.nik.trim(),
    kolom: 'triase',
    nama,
    info: tanpaNik ? `TMP-${urut} · NIK belum ada` : `NIK ${form.nik.trim()}`,
    status: tanpaNik ? '00:00 · sementara' : '00:00',
    sementara: tanpaNik,
  })
  tambahan.value++
  modalOpen.value = false
  sukses.value = `${nama} ditambahkan ke kolom Triase.`
}
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" @click="bukaModal">Pasien Baru IGD</UiButton>
    </PageHeader>

    <UiAlert v-if="sukses" tone="success" title="Pasien baru terdaftar" :text="sukses" />

    <div class="row igd-stats">
      <StatCard v-for="s in ringkasan" :key="s.key" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <div class="board">
      <section v-for="k in kolomProses" :key="k.key" class="board__col">
        <header class="board__head">
          <p class="board__title" :class="k.titleTone !== 'text' && `t-${k.tone}`">{{ k.label }}</p>
          <UiBadge :tone="k.tone">{{ perKolom[k.key].length }}</UiBadge>
        </header>
        <article v-for="p in perKolom[k.key]" :key="p.id" class="card board__card">
          <p class="board__nama">{{ p.nama }}</p>
          <p class="t-xs t-muted">{{ p.info }}</p>
          <UiBadge :tone="k.tone">{{ p.status }}</UiBadge>
          <RouterLink :to="detailTo(p)" class="t-xs">Buka detail →</RouterLink>
        </article>
      </section>
    </div>

    <UiAlert
      v-for="p in sementara"
      :key="p.id"
      tone="warning"
      title="Identitas sementara"
      :text="`${p.nama} tetap mendapat pelayanan; lengkapi NIK dan IHS setelah kondisi memungkinkan.`"
    />

    <UiModal v-model:open="modalOpen" title="Pasien Baru IGD" subtitle="Pasien tanpa identitas tetap dilayani dengan identitas sementara." width="520px">
      <div class="stack">
        <FormField label="Nama pasien" hint="Kosongkan bila belum diketahui (Unknown-n).">
          <input v-model="form.nama" class="input" placeholder="Nama lengkap" />
        </FormField>
        <FormField label="NIK" hint="Kosongkan untuk membuat nomor sementara (TMP-xxx).">
          <input v-model="form.nik" class="input" inputmode="numeric" placeholder="16 digit NIK" />
        </FormField>
        <FormField label="Keluhan utama" required :error="error">
          <input v-model="form.keluhan" class="input" :class="{ 'input--error': error }" placeholder="Keluhan saat datang" />
        </FormField>
      </div>
      <template #footer>
        <UiButton @click="modalOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanPasien">Daftarkan ke triase</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.board { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.board__col {
  display: flex; flex-direction: column; gap: 12px; min-height: 480px; min-width: 0; padding: 12px;
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: var(--r-md);
}
.board__head { display: flex; gap: 6px; align-items: flex-start; }
.board__title { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; }
.board__card { align-items: flex-start; }
.board__card > p { width: 100%; overflow-wrap: anywhere; }
.board__nama { font-size: 13px; font-weight: 600; }
@media (max-width: 1100px) {
  .igd-stats { flex-wrap: wrap; }
  .igd-stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .board { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .board__col { min-height: 0; }
}
@media (max-width: 700px) {
  .board { grid-template-columns: minmax(0, 1fr); }
}
</style>
