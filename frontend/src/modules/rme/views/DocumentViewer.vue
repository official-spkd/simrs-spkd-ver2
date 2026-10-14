<script setup>
/** RME-02 · RME — Document Viewer */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { PageHeader, UiAlert, UiBadge, UiButton } from '@/components/ui'
import { formatJam } from '@/utils/format'
import PatientBanner from './parts-a/PatientBanner.vue'
import ttdDokter from '@/assets/img/rme/ttd-dokter.svg'
import { pasienAktif, dokumen, dokumenDefault } from '../data-a'

const route = useRoute()
const idDok = computed(() => (dokumen[route.query.id] ? route.query.id : dokumenDefault))
const dok = computed(() => dokumen[idDok.value])

// Akses dokumen dicatat saat layar dibuka
const jamBuka = formatJam(new Date())

// Toolbar pratinjau: zoom, putar, cari
const tingkatZoom = [100, 125, 150, 75]
const zoom = ref(100)
const putar = ref(0)
const modeCari = ref(false)
const kataCari = ref('')
function gantiZoom() {
  zoom.value = tingkatZoom[(tingkatZoom.indexOf(zoom.value) + 1) % tingkatZoom.length]
}
function gantiPutar() {
  putar.value = (putar.value + 180) % 360
}

// Pecah teks menjadi potongan agar kata yang dicari bisa disorot
function sorot(teks) {
  const q = kataCari.value.trim()
  if (!modeCari.value || !q) return [{ t: teks, hit: false }]
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return teks.split(re).filter(Boolean).map((t) => ({ t, hit: t.toLowerCase() === q.toLowerCase() }))
}
const jumlahHasil = computed(() => {
  const q = kataCari.value.trim().toLowerCase()
  if (!q) return 0
  return dok.value.isi.join(' ').toLowerCase().split(q).length - 1
})

const metadata = computed(
  () => `${idDok.value} LOINC ${dok.value.loinc} Jenis: ${dok.value.jenis} Penulis: ${dok.value.penulis} ${dok.value.waktu}`,
)

const hasil = ref(null)
function unduhPdf() {
  hasil.value = { title: 'PDF diunduh', text: `${dok.value.judul} · ${idDok.value}.pdf · tercatat dalam jejak audit.` }
}
function cetak() {
  window.print()
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" class="no-print" />

    <div class="dv">
      <aside class="dv__side no-print">
        <section class="card">
          <h3 class="t-title">Metadata dokumen</h3>
          <p class="t-strong dv__name">{{ dok.judul }}</p>
          <p class="t-sm">{{ metadata }}</p>
          <UiBadge tone="success" class="self-start">✓ Sertifikat BSrE valid</UiBadge>
          <UiBadge tone="success" class="self-start">DocumentReference · Terkirim</UiBadge>
          <p class="t-xs t-muted">Timestamp {{ dok.timestamp }} Versi 1 · checksum tervalidasi</p>
          <div><UiButton variant="primary" @click="unduhPdf">Unduh PDF</UiButton></div>
          <div><UiButton @click="cetak">Cetak</UiButton></div>
        </section>
        <UiAlert tone="info" title="Akses tercatat" :text="`Dibuka dr. Andi · ${jamBuka} WIB`" />
        <UiAlert v-if="hasil" tone="success" :title="hasil.title" :text="hasil.text" />
      </aside>

      <div class="dv__main">
        <div class="seg no-print" role="toolbar" aria-label="Alat pratinjau">
          <button type="button" class="seg__tab is-active">Halaman 1 / 1</button>
          <button type="button" class="seg__tab" @click="gantiZoom">{{ zoom }}%</button>
          <button type="button" class="seg__tab" :class="{ 'is-on': putar }" @click="gantiPutar">Putar</button>
          <button type="button" class="seg__tab" :class="{ 'is-on': modeCari }" @click="modeCari = !modeCari">Cari dokumen</button>
          <label v-if="modeCari" class="dv__search">
            <Search aria-hidden="true" />
            <input v-model="kataCari" type="search" placeholder="Cari di dokumen…" aria-label="Cari di dokumen" />
            <span v-if="kataCari" class="t-xs t-muted">{{ jumlahHasil }} hasil</span>
          </label>
        </div>

        <div class="dv__scroll">
          <article class="dv__paper" :style="{ zoom: zoom / 100, transform: putar ? `rotate(${putar}deg)` : null }">
            <p class="dv__kop">RUMAH SAKIT SPKD</p>
            <p class="dv__kop-sub">Pelayanan terpadu · Dokumen simulasi / bukan dokumen resmi</p>
            <div class="dv__rule" />
            <p class="dv__title">{{ dok.judul }}</p>
            <p class="t-sm">
              Nomor: {{ dok.nomor }} Nama: {{ pasienAktif.nama }} · RM 00-12-34 NIK: 32XXXXXXXXXX · IHS P024783755348 Tanggal:
              {{ dok.tanggal }}
            </p>
            <div class="dv__body">
              <p v-for="(par, i) in dok.isi" :key="i">
                <template v-for="(s, j) in sorot(par)" :key="j"><mark v-if="s.hit">{{ s.t }}</mark><template v-else>{{ s.t }}</template></template>
              </p>
            </div>
            <div class="dv__sign">
              <p class="t-sm">{{ dok.pengesahan.jabatan }}</p>
              <img :src="ttdDokter" alt="Tanda tangan ilustratif" class="dv__ttd" />
              <p class="t-sm t-strong">{{ dok.pengesahan.nama }}</p>
              <UiBadge tone="success">✓ e-Sign BSrE · {{ dok.waktu }}</UiBadge>
            </div>
            <p class="dv__foot">LOINC {{ dok.loinc }} · DocumentReference · Halaman 1 dari 1</p>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dv { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.dv__side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.dv__name { font-size: 14px; }
.self-start { align-self: flex-start; }
.dv__main { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 16px; }

/* Toolbar bergaya tab segmen */
.seg {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  width: 100%;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  flex-wrap: wrap;
}
.seg__tab {
  background: var(--c-surface);
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--c-muted);
  white-space: nowrap;
  cursor: pointer;
}
.seg__tab:hover:not(.is-active) { color: var(--c-text); }
.seg__tab.is-on { color: var(--c-primary); }
.seg__tab.is-active { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; cursor: default; }
.dv__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
}
.dv__search svg { width: 16px; height: 16px; color: var(--c-muted); }
.dv__search input { border: 0; outline: 0; font: inherit; font-size: 12px; width: 180px; background: transparent; color: var(--c-text); }

/* Pratinjau kertas dokumen */
.dv__scroll { width: 100%; overflow: auto; }
.dv__paper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  transition: transform 0.2s;
}
.dv__kop { font-size: 16px; font-weight: 600; text-align: center; }
.dv__kop-sub { font-size: 11px; color: var(--c-muted); text-align: center; }
.dv__rule { height: 2px; background: var(--c-primary); }
.dv__title { font-size: 20px; font-weight: 600; text-align: center; }
.dv__body { font-size: 13px; display: flex; flex-direction: column; gap: 19px; }
.dv__body mark { background: var(--c-warning-soft); color: inherit; border-radius: 2px; }
.dv__sign { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; padding-top: 16px; }
.dv__ttd { width: 120px; height: 38px; display: block; }
.dv__foot { font-size: 10px; color: var(--c-muted); }
@media (max-width: 1100px) {
  .dv { flex-direction: column; }
  .dv__side { width: 100%; }
}
</style>
