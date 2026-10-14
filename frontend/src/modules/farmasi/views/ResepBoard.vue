<script setup>
/** FRS-01 · Farmasi — Resep Board */
import { computed } from 'vue'
import { PageHeader, UiBadge, UiAlert, StatCard } from '@/components/ui'
import { formatJam, useNow } from '@/utils/format'
import { ringkasanResep, kolomResep, resepBoard } from '../data-a'

const now = useNow()
const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)

// Resep per kolom; CITO selalu di atas (prioritas)
const perKolom = computed(() =>
  Object.fromEntries(
    kolomResep.map((k) => [k.key, resepBoard.filter((r) => r.kolom === k.key).sort((a, b) => (b.cito ? 1 : 0) - (a.cito ? 1 : 0))]),
  ),
)
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row frs-stats">
      <StatCard v-for="s in ringkasanResep" :key="s.key" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <div class="board">
      <section v-for="k in kolomResep" :key="k.key" class="board__col">
        <header class="board__head">
          <p class="board__title" :class="k.titleTone !== 'text' && `t-${k.titleTone}`">{{ k.label }}</p>
          <UiBadge :tone="k.tone">{{ perKolom[k.key].length }}</UiBadge>
        </header>
        <article v-for="r in perKolom[k.key]" :key="r.id" class="card board__card">
          <p class="board__nama">{{ r.nama }}</p>
          <p class="t-xs t-muted">{{ r.info }}</p>
          <UiBadge :tone="r.cito ? 'danger' : k.tone">{{ r.status }}</UiBadge>
          <RouterLink :to="{ path: k.to, query: { id: r.id } }" class="t-xs">Buka detail →</RouterLink>
        </article>
      </section>
    </div>

    <UiAlert
      tone="info"
      title="MedicationRequest terhubung"
      text="Resep bertanda tangan masuk otomatis ke board. Prioritaskan CITO dan resep tertua."
    />
  </div>
</template>

<style scoped>
.board { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
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
  .frs-stats { flex-wrap: wrap; }
  .frs-stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .board { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .board__col { min-height: 0; }
}
@media (max-width: 700px) {
  .board { grid-template-columns: minmax(0, 1fr); }
}
</style>
