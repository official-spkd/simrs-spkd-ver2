<script setup>
/** RME-01 · RME — Timeline Pasien */
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiBadge, UiButton, DataTable, UiModal } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import SegTabs from './parts-a/SegTabs.vue'
import { pasienAktif, tabEpisode, nadaJenis, episode, dokumenEpisode, logAkses } from '../data-a'

const router = useRouter()

// Filter episode per jenis layanan
const tab = ref(tabEpisode[0])
const episodeTampil = computed(() => (tab.value === tabEpisode[0] ? episode : episode.filter((e) => e.jenis === tab.value)))

// Episode terpilih → daftar dokumen
const episodeAktif = ref(episode[episode.length - 1].id)
const dokumen = computed(() => dokumenEpisode[episodeAktif.value] ?? [])
const dokTerpilih = ref(dokumen.value[0]?.id ?? null)
watch(episodeAktif, () => (dokTerpilih.value = dokumen.value[0]?.id ?? null))

const columns = [
  { key: 'dokumen', label: 'Dokumen', strong: true },
  { key: 'jenis', label: 'Jenis / LOINC' },
  { key: 'penulis', label: 'Penulis' },
  { key: 'waktu', label: 'Waktu' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terkirim' ? 'success' : '') },
]

// Klik baris → buka dokumen di Document Viewer
function bukaDokumen(row) {
  router.push({ path: '/rme/document-viewer', query: { id: row.id } })
}

const logBuka = ref(false)
const hasil = ref(null)
function unduhSemua() {
  hasil.value = {
    title: 'Arsip RME disiapkan',
    text: `RME ${pasienAktif.nama} (${episode.length} episode) diunduh sebagai .zip pukul ${formatJam(new Date())} WIB · tercatat dalam jejak audit.`,
  }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <SegTabs v-model="tab" :tabs="tabEpisode" />

    <div class="tl__episodes">
      <article
        v-for="e in episodeTampil"
        :key="e.id"
        class="card tl__ep"
        :class="{ 'is-active': e.id === episodeAktif }"
      >
        <UiBadge :tone="nadaJenis[e.jenis]" class="self-start">{{ e.jenis }}</UiBadge>
        <p class="tl__date">{{ e.tanggal }}</p>
        <p class="tl__sum">{{ e.ringkasan }}</p>
        <p class="t-sm">{{ e.status }}</p>
        <div><UiButton @click="episodeAktif = e.id">Buka episode</UiButton></div>
      </article>
    </div>

    <DataTable
      v-model:selected="dokTerpilih"
      title="Dokumen episode terpilih"
      :columns="columns"
      :rows="dokumen"
      selectable
      export-name="dokumen-episode"
      @row-click="bukaDokumen"
    />

    <UiAlert v-if="hasil" tone="success" :title="hasil.title" :text="hasil.text" />

    <div class="row-between tl__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row tl__btns">
        <UiButton @click="logBuka = true">Log akses</UiButton>
        <UiButton variant="primary" @click="unduhSemua">Unduh seluruh RME (.zip)</UiButton>
      </div>
    </div>

    <UiModal v-model:open="logBuka" title="Log akses RME" :subtitle="`${pasienAktif.nama} · RM 00-12-34`" width="640px">
      <ul class="tl__log">
        <li v-for="l in logAkses" :key="l.waktu + l.aksi">
          <p class="t-strong">{{ l.aksi }}</p>
          <p class="t-xs t-muted">{{ l.waktu }} WIB · {{ l.pengguna }} · {{ l.peran }}</p>
        </li>
      </ul>
      <template #footer>
        <UiButton @click="logBuka = false">Tutup</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.tl__episodes { display: flex; gap: 16px; width: 100%; }
.tl__ep { flex: 1 1 0; min-width: 0; gap: 16px; }
.tl__ep.is-active { border-color: var(--c-primary); }
.tl__date { font-size: 22px; font-weight: 600; }
.tl__sum { font-size: 14px; }
.self-start { align-self: flex-start; }
.tl__btns { gap: 8px; }
.tl__log { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.tl__log li { padding: 12px 0; border-bottom: 1px solid var(--c-border); display: flex; flex-direction: column; gap: 2px; }
.tl__log li:last-child { border-bottom: 0; }
@media (max-width: 1100px) {
  .tl__episodes { flex-wrap: wrap; }
  .tl__ep { flex-basis: calc(50% - 8px); }
  .tl__actions { flex-wrap: wrap; gap: 12px; }
}
</style>
