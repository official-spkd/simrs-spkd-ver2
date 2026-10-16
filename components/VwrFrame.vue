<script setup lang="ts">
// Kerangka layar TV (Figma VWR-01/02): header logo + judul + jam, isi, pita informasi, status koneksi; tombol aktifkan suara.
import logo from '~/assets/images/logo-sidebar.png'
defineProps<{ kode: string; judul: string; terhubung: boolean; diperbarui: string; soundOn: boolean; supported: boolean }>()
const emit = defineEmits(['suara'])
const { jam, tanggal } = useKioskClock()
const jamDetik = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${pad(d.getHours(), 2)}.${pad(d.getMinutes(), 2)}.${pad(d.getSeconds(), 2)}`
}
</script>
<template>
  <div class="vwr">
    <header class="vh">
      <img :src="logo" alt="SIMRS SPKD" width="200" height="77" class="vlogo">
      <p class="vjudul">{{ judul }}</p>
      <div class="vjam"><b>{{ jam }}</b><span>{{ tanggal }}</span></div>
    </header>
    <slot />
    <div class="vband">Siapkan kartu identitas dan kartu BPJS. Dengarkan panggilan dan ikuti nomor antrean Anda.</div>
    <footer class="vfoot">
      <span><i :class="{ off: !terhubung }">●</i> {{ terhubung ? 'Display terhubung' : 'Display terputus · mencoba menghubungkan ulang' }} · Pembaruan terakhir {{ jamDetik(diperbarui) }}</span>
      <span class="vkanan">
        <button v-if="supported && !soundOn" type="button" class="vsound" @click="emit('suara')">Aktifkan suara</button>
        <span v-else-if="soundOn">Suara aktif ·</span>
        {{ kode }} · RS SPKD · Data demo
      </span>
    </footer>
  </div>
</template>
<style scoped>
.vwr { min-height: 100vh; background: #06345d; color: #fff; padding: 48px; display: flex; flex-direction: column; gap: 28px; position: relative; }
.vh { display: flex; gap: 32px; align-items: center; }
.vlogo { width: 200px; height: 77px; object-fit: contain; flex: none; }
.vjudul { flex: 1; min-width: 0; margin: 0; font-size: 36px; font-weight: 600; line-height: 1.45; }
.vjam { display: flex; flex-direction: column; gap: 8px; white-space: nowrap; }
.vjam b { font-size: 52px; font-weight: 600; line-height: 1; }
.vjam span { font-size: 24px; color: #afcad8; }
.vband { background: #008d96; border-radius: 12px; padding: 24px; font-size: 28px; line-height: 1.45; }
.vfoot { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 24px; color: #afcad8; margin-top: auto; }
.vfoot i { font-style: normal; color: #afcad8; }
.vfoot i.off { color: #f2a7a0; }
.vkanan { display: inline-flex; align-items: center; gap: 12px; }
.vsound { background: #fff; color: #06345d; border: 0; border-radius: 8px; padding: 6px 14px; font: inherit; font-size: 18px; font-weight: 600; cursor: pointer; }
@media (max-width: 767px) {
  .vwr { padding: 16px; gap: 14px; }
  .vh { flex-wrap: wrap; gap: 12px; }
  .vlogo { width: 130px; height: 50px; }
  .vjudul { font-size: 22px; flex-basis: 100%; order: 3; }
  .vjam b { font-size: 32px; } .vjam span { font-size: 15px; }
  .vband { font-size: 18px; padding: 16px; } .vfoot { font-size: 15px; }
}
</style>
