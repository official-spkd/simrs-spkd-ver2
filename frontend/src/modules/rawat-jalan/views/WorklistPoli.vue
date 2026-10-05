<script setup>
/** RJ-01 · Rawat jalan — Worklist Poli */
import { computed, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, UiCard, StatCard, DataTable } from '@/components/ui'
import { useNow, formatJam } from '@/utils/format'
import { ringkasanWorklist, worklist } from '../data-a'

const now = useNow()
const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)

const selected = ref('J-07')
const pasien = computed(() => worklist.find((r) => r.id === selected.value) ?? worklist[0])
const adaAlergi = computed(() => pasien.value.alergi !== 'Tidak ada')

// Pemanggilan antrean: status lokal + pemberitahuan
const dipanggil = ref('')
function panggil() {
  dipanggil.value = pasien.value.antrean
}

const columns = [
  { key: 'antrean', label: 'Antrean', strong: true },
  { key: 'pasien', label: 'Pasien / NIK' },
  { key: 'tunggu', label: 'Tunggu' },
  { key: 'petugas', label: 'Perawat / dokter', tone: () => 'warning' },
  { key: 'alergi', label: 'Alergi', tone: (r) => r.alergiTone },
]
</script>

<template>
  <div class="page">
    <PageHeader>
      <UiButton variant="primary" @click="panggil">Panggil {{ pasien.antrean }}</UiButton>
    </PageHeader>

    <UiAlert
      v-if="dipanggil"
      tone="success"
      :title="`${dipanggil} dipanggil`"
      text="Nomor antrean tampil di layar Poli Jantung dan diumumkan."
    />

    <div class="wl__stats">
      <StatCard v-for="s in ringkasanWorklist" :key="s.label" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <div class="wl__main">
      <DataTable
        v-model:selected="selected"
        class="grow"
        :columns="columns"
        :rows="worklist"
        selectable
        export-name="worklist-poli"
      />

      <UiCard class="wl__side" :title="`Pasien terpilih · ${pasien.antrean}`">
        <p class="t-lg">{{ pasien.nama }}</p>
        <p>{{ pasien.info }}</p>
        <UiAlert v-if="adaAlergi" tone="danger" :title="pasien.alergi" text="Alergi terkonfirmasi" />
        <p>{{ pasien.keluhan }}</p>
        <div>
          <UiButton variant="primary" :to="{ path: '/rawat-jalan/workspace-pasien', query: { id: pasien.id } }">Buka workspace</UiButton>
        </div>
        <div class="wl__btns">
          <UiButton to="/rawat-jalan/cppt-editor">CPPT</UiButton>
          <UiButton :to="{ path: '/rawat-jalan/order-terpadu', query: { tab: 'Obat' } }">Resep</UiButton>
        </div>
        <div>
          <UiButton to="/rawat-jalan/penilaian-keperawatan">Vital sign</UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.wl__stats { display: flex; gap: 16px; width: 100%; }
.wl__main { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.wl__side { width: 340px; flex-shrink: 0; }
.wl__btns { display: flex; gap: 16px; }
@media (max-width: 1100px) {
  .wl__stats { flex-wrap: wrap; }
  .wl__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .wl__main { flex-direction: column; }
  .wl__side { width: 100%; }
}
</style>
