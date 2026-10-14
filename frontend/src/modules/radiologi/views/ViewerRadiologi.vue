<script setup>
/** RAD-03 · Radiologi — Viewer Radiologi (viewer OHIF ilustratif) */
import { computed, reactive, ref } from 'vue'
import { Move, ZoomIn, Ruler, Contrast, RotateCw, Maximize } from 'lucide-vue-next'
import { PageHeader, UiButton } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import { pasienAktif, viewerStudi } from '../data-a'
import imgThorax from '@/assets/img/radiologi/thorax-pa.jpg'
import imgThumbnail from '@/assets/img/radiologi/thorax-thumbnail.jpg'

const awal = { zoom: 100, rotasi: 0, windowing: 'Lung', geserX: 0, geserY: 0 }
const v = reactive({ ...awal })
const alat = ref(null) // 'move' | 'ruler'
const viewerEl = ref(null)

const tools = [
  { key: 'move', label: 'Geser citra', icon: Move },
  { key: 'zoom', label: 'Perbesar', icon: ZoomIn },
  { key: 'ruler', label: 'Ukur panjang', icon: Ruler },
  { key: 'contrast', label: 'Ganti windowing', icon: Contrast },
  { key: 'rotate', label: 'Putar 90°', icon: RotateCw },
  { key: 'max', label: 'Layar penuh', icon: Maximize },
]

function pakai(key) {
  if (key === 'zoom') v.zoom = v.zoom >= 300 ? 100 : v.zoom + 25
  else if (key === 'rotate') v.rotasi = (v.rotasi + 90) % 360
  else if (key === 'contrast') v.windowing = v.windowing === 'Lung' ? 'Bone' : 'Lung'
  else if (key === 'max') {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else viewerEl.value?.requestFullscreen?.()
  } else alat.value = alat.value === key ? null : key
}

function reset() {
  Object.assign(v, awal)
  alat.value = null
}

// Geser citra dengan seret mouse saat alat "move" aktif
let seret = null
function mulaiSeret(e) {
  if (alat.value !== 'move') return
  seret = { x: e.clientX - v.geserX, y: e.clientY - v.geserY }
}
function geser(e) {
  if (!seret) return
  v.geserX = e.clientX - seret.x
  v.geserY = e.clientY - seret.y
}
function akhiriSeret() {
  seret = null
}

const gayaCitra = computed(() => ({
  transform: `translate(${v.geserX}px, ${v.geserY}px) scale(${v.zoom / 100}) rotate(${v.rotasi}deg)`,
  filter: v.windowing === 'Bone' ? 'contrast(1.6) brightness(0.9)' : 'none',
  cursor: alat.value === 'move' ? 'grab' : 'default',
}))
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienAktif" />

    <section ref="viewerEl" class="viewer">
      <div class="viewer__toolbar">
        <p class="viewer__judul">{{ viewerStudi.judul }}</p>
        <div class="viewer__tools">
          <button
            v-for="t in tools"
            :key="t.key"
            type="button"
            class="viewer__tool"
            :class="{ 'is-active': alat === t.key }"
            :title="t.label"
            :aria-label="t.label"
            @click="pakai(t.key)"
          >
            <component :is="t.icon" :width="20" :height="20" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="viewer__body">
        <div class="viewer__seri">
          <p class="viewer__muted">{{ viewerStudi.seri }}</p>
          <img :src="imgThumbnail" alt="Thumbnail ilustrasi thorax" class="viewer__thumb" />
          <p class="viewer__kecil">{{ viewerStudi.thumbnailInfo }}</p>
          <UiButton class="self-start" @click="reset">Reset</UiButton>
        </div>

        <div
          class="viewer__citra"
          @mousedown.prevent="mulaiSeret"
          @mousemove="geser"
          @mouseup="akhiriSeret"
          @mouseleave="akhiriSeret"
        >
          <p class="viewer__muted viewer__overlay">{{ viewerStudi.overlay }}</p>
          <div class="viewer__bingkai">
            <img :src="imgThorax" alt="Radiograf ilustratif" class="viewer__img" :style="gayaCitra" draggable="false" />
            <div v-if="alat === 'ruler'" class="viewer__ukur"><span>{{ viewerStudi.pengukuran }}</span></div>
          </div>
          <p class="viewer__peringatan">{{ viewerStudi.peringatan }}</p>
        </div>

        <div class="viewer__info">
          <p class="viewer__teks">
            Windowing
            <span :class="{ 'is-on': v.windowing === 'Lung' }">Lung</span> /
            <span :class="{ 'is-on': v.windowing === 'Bone' }">Bone</span><br />
            Pengukuran<br />
            Panjang: {{ viewerStudi.pengukuran }}<br />
            Zoom: {{ v.zoom }}%<br />
            Seri: 1 / 1
          </p>
          <UiButton variant="primary" class="self-start" to="/radiologi/reporting">Lapor</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.viewer { background: #101c2c; border-radius: var(--r-md); padding: 16px; display: flex; flex-direction: column; gap: 16px; color: #fff; }
.viewer__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.viewer__judul { flex: 1; min-width: 0; font-size: 13px; }
.viewer__tools { display: flex; gap: 20px; }
.viewer__tool {
  width: 20px; height: 20px; padding: 0; border: 0; background: none; color: #fff; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 4px;
}
.viewer__tool:hover, .viewer__tool.is-active { color: #ffd276; }
.viewer__body { display: flex; gap: 16px; align-items: flex-start; }
.viewer__seri { width: 145px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.viewer__thumb { width: 140px; height: 160px; object-fit: cover; border-radius: 6px; display: block; }
.viewer__muted { font-size: 12px; color: #adc0d6; }
.viewer__kecil { font-size: 11px; }
.viewer__citra {
  flex: 1; min-width: 0; height: 520px; background: #050a10; padding: 18px;
  display: flex; flex-direction: column; align-items: center; gap: 12px; overflow: hidden; user-select: none;
}
.viewer__overlay { align-self: stretch; }
.viewer__bingkai { position: relative; width: 500px; max-width: 100%; height: 420px; overflow: hidden; }
.viewer__img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.15s, filter 0.15s; }
.viewer__ukur {
  position: absolute; left: 30%; right: 30%; top: 55%; border-top: 2px dashed #ffd276;
  display: flex; justify-content: center; pointer-events: none;
}
.viewer__ukur span { margin-top: 4px; font-size: 11px; color: #ffd276; background: rgba(5, 10, 16, 0.7); padding: 0 4px; }
.viewer__peringatan { font-size: 11px; color: #ffd276; text-align: center; }
.viewer__info { width: 150px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.viewer__teks { font-size: 12px; }
.viewer__teks .is-on { font-weight: 600; color: #ffd276; }
.self-start { align-self: flex-start; }
.viewer:fullscreen { border-radius: 0; overflow: auto; }
.viewer:fullscreen .viewer__citra { height: calc(100vh - 100px); }
@media (max-width: 1100px) {
  .viewer__body { flex-wrap: wrap; }
  .viewer__seri, .viewer__info { width: auto; flex: 1 1 140px; }
  .viewer__citra { order: -1; flex-basis: 100%; }
}
</style>
