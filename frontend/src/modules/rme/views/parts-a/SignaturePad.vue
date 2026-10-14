<script setup>
/**
 * "Pad tanda tangan" — menampilkan tanda tangan contoh bila sudah ada,
 * atau kanvas untuk digambar dengan mouse/jari bila kosong.
 */
import { nextTick, onMounted, ref, watch } from 'vue'
import ttdContoh from '@/assets/img/rme/ttd-pasien.svg'

const props = defineProps({
  // true = tampilkan tanda tangan contoh (sudah tersimpan)
  sample: { type: Boolean, default: false },
})
const terisi = defineModel({ type: Boolean, default: false })

const canvas = ref(null)
let ctx = null
let menggambar = false

function siapkan() {
  const c = canvas.value
  if (!c) return
  const r = c.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  c.width = r.width * dpr
  c.height = r.height * dpr
  ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = getComputedStyle(c).getPropertyValue('--c-primary').trim() || '#1762c4'
}

function titik(e) {
  const r = canvas.value.getBoundingClientRect()
  return [e.clientX - r.left, e.clientY - r.top]
}
function mulai(e) {
  if (!ctx) return
  menggambar = true
  canvas.value.setPointerCapture?.(e.pointerId)
  ctx.beginPath()
  ctx.moveTo(...titik(e))
}
function gerak(e) {
  if (!menggambar) return
  ctx.lineTo(...titik(e))
  ctx.stroke()
  terisi.value = true
}
function selesai() {
  menggambar = false
}

/** Kosongkan kanvas (dipanggil tombol "Ulangi"). */
function kosongkan() {
  terisi.value = false
  if (ctx && canvas.value) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
}
defineExpose({ kosongkan })

watch(
  () => props.sample,
  async (v) => {
    if (!v) {
      await nextTick()
      siapkan()
    }
  },
)
onMounted(() => !props.sample && siapkan())
</script>

<template>
  <div class="pad">
    <img v-if="sample" :src="ttdContoh" alt="Tanda tangan contoh" class="pad__img" />
    <template v-else>
      <canvas
        ref="canvas"
        class="pad__canvas"
        aria-label="Area tanda tangan"
        @pointerdown="mulai"
        @pointermove="gerak"
        @pointerup="selesai"
        @pointerleave="selesai"
      />
      <p v-if="!terisi" class="pad__hint">Tanda tangan di sini</p>
    </template>
  </div>
</template>

<style scoped>
.pad {
  position: relative;
  height: 170px;
  width: 100%;
  padding: 24px;
  border-radius: 8px;
  background: var(--c-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pad__img { width: 210px; height: 70px; display: block; }
.pad__canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
.pad__hint { font-size: 12px; color: var(--c-muted); pointer-events: none; }
</style>
