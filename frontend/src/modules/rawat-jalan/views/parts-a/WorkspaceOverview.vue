<script setup>
/** Ringkasan klinis + panel "Order & tindak lanjut" (RJ-02, RJ-05, RJ-07). */
import { UiAlert, UiBadge, UiButton, UiCard } from '@/components/ui'
import { ringkasanKlinis, orderTindakLanjut } from '../../data-a'

defineProps({
  orderStatus: { type: String, default: orderTindakLanjut.status },
})
const emit = defineEmits(['tambah-order', 'tutup-kunjungan', 'vital-sign'])
</script>

<template>
  <div class="wo">
    <UiCard class="grow" title="Ringkasan klinis">
      <p class="t-strong">{{ ringkasanKlinis.keluhan }}</p>
      <p>{{ ringkasanKlinis.diagnosis }}</p>
      <UiAlert tone="success" :title="ringkasanKlinis.penilaian.title" :text="ringkasanKlinis.penilaian.text" />
      <div class="wo__actions">
        <UiButton variant="primary" to="/rawat-jalan/cppt-editor">CPPT</UiButton>
        <UiButton @click="emit('vital-sign')">Vital sign</UiButton>
        <UiButton :to="{ path: '/rawat-jalan/order-terpadu', query: { tab: 'Obat' } }">Resep</UiButton>
      </div>
    </UiCard>

    <UiCard class="wo__side" title="Order & tindak lanjut">
      <p>{{ orderTindakLanjut.ringkas }}</p>
      <div><UiBadge tone="success">{{ orderStatus }}</UiBadge></div>
      <div><UiButton @click="emit('tambah-order')">Tambah order</UiButton></div>
      <div><UiButton @click="emit('tutup-kunjungan')">Tutup kunjungan</UiButton></div>
    </UiCard>
  </div>
</template>

<style scoped>
.wo { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.wo__side { width: 340px; flex-shrink: 0; }
.wo__actions { display: flex; gap: 16px; flex-wrap: wrap; }
@media (max-width: 1100px) {
  .wo { flex-direction: column; }
  .wo__side { width: 100%; }
}
</style>
