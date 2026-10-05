<script setup>
/** KSK-01 · Selamat datang — layar awal anjungan mandiri. */
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Hand, Play, Pause } from 'lucide-vue-next'
import { UiButton } from '@/components/ui'
import KioskFooter from './parts-a/KioskFooter.vue'
import imgPanduan from '@/assets/img/kiosk/panduan-pasien.jpg'
import { sambutan, langkahSambutan } from '../data-a.js'

const router = useRouter()

// Simulasi pemutaran video panduan (progres ▰▱)
const putar = ref(false)
const progres = ref(4)
let timer = null
function togglePutar() {
  putar.value = !putar.value
  clearInterval(timer)
  if (putar.value) {
    timer = setInterval(() => {
      progres.value = (progres.value % sambutan.video.langkah) + 1
    }, 1500)
  }
}
onBeforeUnmount(() => clearInterval(timer))
const bilahProgres = computed(
  () => '▰'.repeat(progres.value) + '▱'.repeat(sambutan.video.langkah - progres.value),
)

function mulai() {
  router.push('/kiosk/menu-utama')
}
</script>

<template>
  <p class="k-code">KSK-01 · Anjungan mandiri</p>
  <h1 class="k-hero">{{ sambutan.judul }}</h1>
  <p class="k-sub">{{ sambutan.subjudul }}</p>

  <div class="video">
    <img :src="imgPanduan" alt="Panduan pasien menggunakan anjungan mandiri" class="video__img" />
    <button type="button" class="video__ctrl" @click="togglePutar">
      <component :is="putar ? Pause : Play" class="video__icon" aria-hidden="true" />
      <span class="grow">{{ sambutan.video.label }} · {{ sambutan.video.durasi }}</span>
      <span aria-hidden="true">{{ bilahProgres }}</span>
    </button>
  </div>

  <UiButton variant="primary" size="lg" :icon="Hand" @click="mulai">Sentuh Layar untuk Mulai</UiButton>

  <div class="langkah">
    <div v-for="l in langkahSambutan" :key="l.judul" class="langkah__item">
      <p class="langkah__judul">{{ l.judul }}</p>
      <p class="langkah__teks">{{ l.teks }}</p>
    </div>
  </div>

  <KioskFooter back="/kiosk/selamat-datang" />
</template>

<style scoped>
.k-code { font-size: 14px; color: var(--c-muted); }
.k-hero { font-size: 56px; font-weight: 600; line-height: 1.45; text-align: center; color: var(--c-text); }
.k-sub { font-size: 24px; color: var(--c-muted); text-align: center; }
.video {
  display: flex;
  flex-direction: column;
  height: 470px;
  background: var(--c-primary-soft);
  border-radius: 20px;
  overflow: hidden;
}
.video__img { width: 100%; height: 380px; object-fit: cover; display: block; }
.video__ctrl {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 20px;
  font-size: 18px;
  color: var(--c-text);
  background: none;
  border: 0;
  text-align: left;
  cursor: pointer;
  flex: 1;
}
.video__icon { width: 20px; height: 20px; flex-shrink: 0; color: var(--c-primary); margin-top: 3px; }
.btn { align-self: flex-start; }
.langkah { display: flex; gap: 16px; }
.langkah__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.langkah__judul { font-size: 22px; font-weight: 600; }
.langkah__teks { font-size: 18px; }
@media (max-width: 700px) {
  .k-hero { font-size: 36px; }
  .video { height: auto; }
  .video__img { height: 240px; }
  .langkah { flex-direction: column; }
}
</style>
