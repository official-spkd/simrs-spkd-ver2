<script setup>
/** Banner pasien rawat inap (biru tua) — dipakai RI-02 s.d. RI-06 */
import { UserRound } from 'lucide-vue-next'

defineProps({
  pasien: { type: Object, required: true }, // { nama, info, layanan, identitas, alergi, alergiTone?, encounter }
})
</script>

<template>
  <section class="banner">
    <div class="banner__top">
      <div class="banner__avatar"><UserRound :width="20" :height="20" /></div>
      <div class="banner__id">
        <p class="banner__nama">{{ pasien.nama }}</p>
        <p class="banner__info">{{ pasien.info }}</p>
      </div>
      <span class="banner__pill banner__pill--layanan">{{ pasien.layanan }}</span>
    </div>
    <p class="banner__info">{{ pasien.identitas }}</p>
    <div class="banner__bottom">
      <span class="banner__pill" :class="`banner__pill--${pasien.alergiTone || 'danger'}`">{{ pasien.alergi }}</span>
      <p class="banner__meta">{{ pasien.encounter }}</p>
    </div>
  </section>
</template>

<style scoped>
.banner { background: #10488f; border-radius: var(--r-md); padding: 20px; display: flex; flex-direction: column; gap: 9px; color: #fff; }
.banner__top, .banner__bottom { display: flex; gap: 12px; align-items: flex-start; }
@media (max-width: 700px) { .banner__top, .banner__bottom { flex-wrap: wrap; } }
.banner__avatar {
  width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%;
  background: rgba(255, 255, 255, 0.13); display: flex; align-items: center; justify-content: center; color: #fff;
}
.banner__id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.banner__nama { font-size: 20px; font-weight: 600; }
.banner__info { font-size: 12px; color: #d8e9ff; }
.banner__meta { flex: 1; min-width: 0; font-size: 11px; color: #d8e9ff; }
.banner__pill { font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: var(--r-pill); white-space: nowrap; flex-shrink: 0; }
.banner__pill--layanan { background: var(--c-primary-soft); color: var(--c-primary); }
.banner__pill--danger { background: var(--c-danger-soft); color: var(--c-danger); }
.banner__pill--warning { background: var(--c-warning-soft); color: var(--c-warning); }
p { margin: 0; line-height: 1.45; }
</style>
