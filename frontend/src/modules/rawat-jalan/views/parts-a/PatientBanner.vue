<script setup>
/** "Banner pasien" — identitas, antrean, alergi & status encounter pasien aktif. */
import { UserRound } from 'lucide-vue-next'
import { pasienAktif } from '../../data-a'

defineProps({
  pasien: { type: Object, default: () => pasienAktif },
})
</script>

<template>
  <section class="pb">
    <div class="pb__top">
      <div class="pb__avatar"><UserRound aria-hidden="true" /></div>
      <div class="pb__name">
        <p class="pb__title">{{ pasien.nama }}</p>
        <p class="pb__sub">{{ pasien.info }}</p>
      </div>
      <span class="badge badge--primary">{{ pasien.antrean }}</span>
    </div>
    <p class="pb__sub">{{ pasien.identitas }}</p>
    <div class="pb__bottom">
      <span class="badge badge--danger">{{ pasien.alergi }}</span>
      <p class="pb__meta">{{ pasien.encounter }}</p>
    </div>
  </section>
</template>

<style scoped>
.pb {
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 100%;
  padding: 20px;
  border-radius: var(--r-md);
  background: #10488f;
  color: #fff;
}
.pb__top,
.pb__bottom { display: flex; gap: 12px; align-items: flex-start; }
.pb__avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pb__avatar svg { width: 20px; height: 20px; color: currentColor; }
.pb__name { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pb__title { font-size: 20px; font-weight: 600; }
.pb__sub { font-size: 12px; color: #d8e9ff; }
.pb__meta { flex: 1; min-width: 0; font-size: 11px; color: #d8e9ff; }
@media (max-width: 700px) {
  .pb__top, .pb__bottom { flex-wrap: wrap; }
}
</style>
