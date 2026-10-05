<script setup>
/** Bilah bawah kiosk ("← Kembali / Butuh bantuan?") + teks kaki sesi. */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { teksKaki } from '../../data-a.js'

const props = defineProps({
  back: { type: String, default: '' }, // route tujuan "Kembali"; kosong = riwayat sebelumnya
})

const router = useRouter()
const dipanggil = ref(false)

function kembali() {
  if (props.back) router.push(props.back)
  else router.back()
}
</script>

<template>
  <div class="kfoot">
    <button type="button" class="kfoot__link" @click="kembali">← Kembali</button>
    <button type="button" class="kfoot__link kfoot__link--end" @click="dipanggil = true">
      {{ dipanggil ? 'Petugas sedang menuju Anda ✓' : 'Butuh bantuan? Panggil petugas' }}
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
  padding: 0 20px;
  background: #fff;
  border-radius: var(--r-md);
  width: 100%;
}
.kfoot__link {
  flex: 1;
  min-height: 68px;
  text-align: left;
  font-size: 18px;
  color: var(--c-primary);
  background: none;
  border: 0;
  cursor: pointer;
}
.kfoot__link--end { text-align: right; }
.kfoot__note { font-size: 14px; color: var(--c-muted); text-align: center; width: 100%; }
</style>
