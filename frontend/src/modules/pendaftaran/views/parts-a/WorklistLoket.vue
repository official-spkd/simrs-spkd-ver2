<script setup>
/**
 * Isi area kerja Worklist Pendaftaran (dipakai PDR-01 & latar PDR-02):
 * identifikasi pasien, antrean loket, booking menunggu, kunjungan hari ini, shortcut loket.
 * Emit `cari` (kata kunci) saat Enter / F2-scanner.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { UiAlert, UiBadge, UiButton, UiCard, DataTable, FormField } from '@/components/ui'
import { antreanLoket, bookingMenunggu, kunjunganHariIni, totalKunjunganHariIni } from '../../data-a'

const emit = defineEmits(['cari'])
const router = useRouter()
const cari = ref('')
const cariEl = ref(null)
const selected = ref(1)
const pesan = ref(null)

// Antrean loket: indeks antrean yang sedang aktif
const idx = ref(0)
const aktif = computed(() => antreanLoket[idx.value % antreanLoket.length])
const berikut = computed(() => antreanLoket[(idx.value + 1) % antreanLoket.length])
const dipanggil = ref(false)

function panggil() {
  dipanggil.value = true
  pesan.value = { tone: 'success', title: `${aktif.value.nomor} dipanggil`, text: `${aktif.value.nama} diarahkan ke ${aktif.value.loket}.` }
}
function skip() {
  pesan.value = { tone: 'warning', title: `${aktif.value.nomor} dilewati`, text: 'Nomor antrean dipindah ke akhir antrean loket.' }
  idx.value++
  dipanggil.value = false
}

const bookingText = bookingMenunggu.map((b) => `${b.jam} · ${b.nama} · ${b.poli}`).join(' ')

const columns = [
  { key: 'antrean', label: 'Antrean', strong: true },
  { key: 'pasien', label: 'Pasien / RM' },
  { key: 'poli', label: 'Poli' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Menunggu' ? 'warning' : null) },
  { key: 'identitas', label: 'Identitas', tone: (r) => (r.identitas.startsWith('Antrian') ? 'warning' : null) },
]

// Shortcut loket: F2 cari pasien, F4 kunjungan, F8 cetak
function onKey(e) {
  if (e.key === 'F2') { e.preventDefault(); cariEl.value?.focus() }
  else if (e.key === 'F4') { e.preventDefault(); router.push('/pendaftaran/form-kunjungan') }
  else if (e.key === 'F8') { e.preventDefault(); window.print() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="row wl__search">
    <FormField class="grow" label="Identifikasi pasien · F2 / scanner">
      <input
        ref="cariEl"
        v-model="cari"
        class="input"
        type="search"
        placeholder="Cari NIK / No. RM / Nama…"
        @keydown.enter="emit('cari', cari.trim())"
      />
    </FormField>
    <UiButton variant="primary" to="/pendaftaran/form-pasien-baru">+ Pasien Baru</UiButton>
  </div>

  <UiAlert v-if="pesan" :tone="pesan.tone" :title="pesan.title" :text="pesan.text">
    <template #actions><UiButton size="sm" variant="ghost" @click="pesan = null">Tutup</UiButton></template>
  </UiAlert>

  <div class="row wl__main">
    <div class="stack wl__side">
      <UiCard title="Antrean loket">
        <p class="wl__nomor">{{ aktif.nomor }}</p>
        <p class="t-strong">{{ aktif.nama }} · {{ aktif.loket }}</p>
        <p class="t-sm">{{ aktif.identitas }}</p>
        <div class="row">
          <UiButton variant="primary" @click="panggil">{{ dipanggil ? 'Panggil ulang' : 'Panggil' }}</UiButton>
          <UiButton @click="skip">Skip</UiButton>
        </div>
        <p>{{ berikut.nomor }} · {{ berikut.nama }} · {{ berikut.loket }}</p>
        <div><UiBadge tone="warning">Menunggu · {{ berikut.tunggu ?? 0 }} menit</UiBadge></div>
      </UiCard>

      <UiCard :title="`Booking menunggu · ${bookingMenunggu.length}`">
        <p class="t-sm">{{ bookingText }}</p>
        <div><UiButton to="/pendaftaran/daftar-booking">Lihat booking</UiButton></div>
      </UiCard>
    </div>

    <div class="stack grow">
      <DataTable
        v-model:selected="selected"
        :title="`Kunjungan hari ini · ${totalKunjunganHariIni}`"
        :columns="columns"
        :rows="kunjunganHariIni"
        selectable
        export-name="kunjungan-hari-ini"
      />
      <UiAlert
        tone="info"
        title="Shortcut loket"
        text="F2 cari pasien · F4 kunjungan · F8 cetak · Tab / Enter pindah isian · scanner siap"
      />
    </div>
  </div>
</template>

<style scoped>
.wl__search { align-items: flex-end; width: 100%; }
.wl__main { width: 100%; }
.wl__side { width: 300px; flex-shrink: 0; }
.wl__nomor { font-size: 32px; font-weight: 600; color: var(--c-primary); line-height: 1.45; }
@media (max-width: 1100px) {
  .wl__main { flex-direction: column; }
  .wl__side { width: 100%; }
}
</style>
