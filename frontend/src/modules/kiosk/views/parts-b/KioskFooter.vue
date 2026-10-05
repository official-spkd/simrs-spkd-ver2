<script setup>
/** Bilah bawah kiosk: "← Kembali / Butuh bantuan? Panggil petugas" + teks kaki. */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { teksKaki } from '../../data-b.js'

const props = defineProps({
  back: { type: String, default: '/kiosk/menu-utama' }, // tujuan tombol kembali
})

const router = useRouter()
const dipanggil = ref(false)

function kembali() {
  router.push(props.back)
}
function panggilPetugas() {
  dipanggil.value = true
}
</script>

<template>
  <div class="kfoot">
    <button type="button" class="kfoot__link" @click="kembali">← Kembali</button>
    <button type="button" class="kfoot__link kfoot__link--right" @click="panggilPetugas">
      {{ dipanggil ? 'Petugas sedang menuju ke anjungan' : 'Butuh bantuan? Panggil petugas' }}
    </button>
  </div>
  <p class="kfoot__note">{{ teksKaki }}</p>
</template>

<style scoped>
.kfoot {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  min-height: 68px;
  padding: 20px;
  background: #fff;
  border-radius: var(--r-md);
}
.kfoot__link {
  flex: 1 1 0;
  min-width: 0;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: 18px;
  line-height: 1.45;
  color: var(--c-primary);
  text-align: left;
  cursor: pointer;
}
.kfoot__link--right { text-align: right; }
.kfoot__note { font-size: 14px; color: var(--c-muted); text-align: center; }
</style>
