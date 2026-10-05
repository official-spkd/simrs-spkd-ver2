<script setup>
/** "Banner pasien" biru: avatar, nama, demografi, identitas, alergi, kunjungan terakhir, status antrean. */
import { UserRound } from 'lucide-vue-next'

defineProps({
  pasien: { type: Object, required: true }, // { nama, jenisKelamin, umur, rm, nik, ihs, dukcapil, alergi, kunjunganTerakhir }
  penjamin: { type: String, default: '' },
  status: { type: String, default: '' },
})
</script>

<template>
  <section class="bp">
    <div class="bp__top">
      <div class="bp__avatar"><UserRound aria-hidden="true" /></div>
      <div class="bp__id">
        <p class="bp__nama">{{ pasien.nama }}</p>
        <p class="bp__meta">
          {{ pasien.jenisKelamin }} · {{ pasien.umur }} tahun · RM {{ pasien.rm }}<template v-if="penjamin"> · {{ penjamin }}</template>
        </p>
      </div>
      <span v-if="status" class="badge badge--primary">{{ status }}</span>
    </div>
    <p class="bp__meta">
      NIK {{ pasien.nik }} · IHS {{ pasien.ihs || 'Antrian' }}<template v-if="pasien.dukcapil"> · ✓ Dukcapil</template>
    </p>
    <div class="bp__bottom">
      <span v-if="pasien.alergi" class="badge badge--danger">ALERGI: {{ pasien.alergi }}</span>
      <p v-if="pasien.kunjunganTerakhir" class="bp__last">{{ pasien.kunjunganTerakhir }}</p>
    </div>
  </section>
</template>

<style scoped>
.bp {
  width: 100%;
  background: #10488f; /* biru banner pasien (tidak ada token) */
  border-radius: var(--r-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  color: #fff;
}
.bp__top { display: flex; gap: 12px; align-items: flex-start; }
.bp__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bp__avatar svg { width: 20px; height: 20px; color: currentColor; }
.bp__id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.bp__nama { font-size: 20px; font-weight: 600; }
.bp__meta { font-size: 12px; color: #d8e9ff; }
.bp__bottom { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.bp__last { flex: 1; min-width: 0; font-size: 11px; color: #d8e9ff; }
</style>
