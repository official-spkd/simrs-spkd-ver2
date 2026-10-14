<script setup>
/** RME-04 · RME — Kelengkapan RME */
import { computed, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, StatCard, DataTable } from '@/components/ui'
import { useNow, formatJam } from '@/utils/format'
import { downloadCsv } from '@/utils/export'
import PatientBanner from './parts-a/PatientBanner.vue'
import imgRadar from '@/assets/img/rme/radar.svg'
import imgIntiRadar from '@/assets/img/rme/inti-radar.svg'
import { pasienAktif, elemenWajib, ringkasanKelengkapan } from '../data-a'

const now = useNow()
const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)

const total = elemenWajib.length
const lengkap = elemenWajib.filter((e) => e.status.includes('Lengkap')).length
const persen = Math.round((lengkap / total) * 100)

const selected = ref(elemenWajib[0].id)
const columns = [
  { key: 'elemen', label: 'Elemen', strong: true },
  { key: 'status', label: 'Status' },
  { key: 'pj', label: 'Penanggung jawab' },
]

const hasil = ref(null)
function eksporAudit() {
  downloadCsv('audit-rme-00-12-34', columns, elemenWajib)
  hasil.value = { title: 'Audit RME diekspor', text: `${total} elemen · ${persen}% lengkap · tercatat dalam jejak audit.` }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <div class="kr__stats">
      <StatCard label="Kelengkapan episode" :value="`${lengkap} / ${total}`" :note="`${persen}% · siap audit`" />
      <StatCard label="Dokumen bertanda tangan" :value="ringkasanKelengkapan.dokumenTtd" :note="catatan" />
      <StatCard label="Tanggal pemeriksaan" :value="ringkasanKelengkapan.tanggal" :note="catatan" />
    </div>

    <div class="kr__main">
      <section class="card kr__radar">
        <h3 class="t-title">Cakupan {{ total }} elemen</h3>
        <div class="kr__chart" role="img" :aria-label="`Kelengkapan ${persen}% dari ${total} elemen`">
          <img :src="imgRadar" alt="" class="kr__poly" />
          <img :src="imgIntiRadar" alt="" class="kr__core" />
          <div class="kr__value">
            <p class="kr__pct">{{ persen }}%</p>
            <p class="t-sm">{{ total }} elemen</p>
          </div>
        </div>
        <UiBadge :tone="persen === 100 ? 'success' : 'warning'" class="self-start">
          {{ persen === 100 ? 'Lengkap · tidak ada remediasi' : 'Perlu remediasi' }}
        </UiBadge>
      </section>

      <DataTable
        v-model:selected="selected"
        class="grow"
        title="Checklist elemen wajib"
        :columns="columns"
        :rows="elemenWajib"
        selectable
        :searchable="false"
        :filterable="false"
        :exportable="false"
        :paginated="false"
      />
    </div>

    <UiAlert v-if="hasil" tone="success" :title="hasil.title" :text="hasil.text" />

    <div class="row-between kr__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row kr__btns">
        <UiButton to="/rme/timeline-pasien">Buka episode</UiButton>
        <UiButton variant="primary" @click="eksporAudit">Ekspor audit RME</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kr__stats { display: flex; gap: 16px; width: 100%; }
.kr__main { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.kr__radar { width: 360px; flex-shrink: 0; }
.kr__chart { position: relative; width: 300px; height: 270px; display: flex; align-items: center; justify-content: center; }
.kr__poly { width: 240px; height: 240px; display: block; }
.kr__core { position: absolute; left: 95px; top: 80px; width: 110px; height: 110px; }
.kr__value { position: absolute; left: 95px; top: 108px; width: 110px; text-align: center; }
.kr__pct { font-size: 30px; font-weight: 600; color: var(--c-primary); line-height: 1.45; }
.self-start { align-self: flex-start; }
.kr__btns { gap: 8px; }
@media (max-width: 1100px) {
  .kr__stats { flex-wrap: wrap; }
  .kr__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .kr__main { flex-direction: column; }
  .kr__radar { width: 100%; }
  .kr__actions { flex-wrap: wrap; gap: 12px; }
}
</style>
