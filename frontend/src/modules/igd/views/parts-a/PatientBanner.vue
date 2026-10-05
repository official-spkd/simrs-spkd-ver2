<script setup>
/** Banner pasien IGD (biru tua) — IGD-02 s.d. IGD-05 */
import { UserRound } from 'lucide-vue-next'

defineProps({
  pasien: { type: Object, required: true }, // { nama, info, status, identitas, alergi, encounter }
})
</script>

<template>
  <section class="banner">
    <div class="banner__top">
      <div class="banner__avatar"><UserRound :width="20" :height="20" aria-hidden="true" /></div>
      <div class="banner__id">
        <p class="banner__nama">{{ pasien.nama }}</p>
        <p class="banner__info">{{ pasien.info }}</p>
      </div>
      <span class="badge badge--primary">{{ pasien.status }}</span>
    </div>
    <p class="banner__info">{{ pasien.identitas }}</p>
    <div class="banner__bottom">
      <span class="badge badge--warning">{{ pasien.alergi }}</span>
      <p class="banner__meta">{{ pasien.encounter }}</p>
    </div>
  </section>
</template>

<style scoped>
.banner { background: #10488f; border-radius: var(--r-md); padding: 20px; display: flex; flex-direction: column; gap: 9px; color: #fff; }
.banner__top, .banner__bottom { display: flex; gap: 12px; align-items: flex-start; }
.banner__avatar {
  width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%;
  background: rgba(255, 255, 255, 0.13); display: flex; align-items: center; justify-content: center; color: #fff;
}
.banner__id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.banner__nama { font-size: 20px; font-weight: 600; }
.banner__info { font-size: 12px; color: #d8e9ff; }
.banner__meta { flex: 1; min-width: 0; font-size: 11px; color: #d8e9ff; }
.banner .badge { flex-shrink: 0; }
</style>
