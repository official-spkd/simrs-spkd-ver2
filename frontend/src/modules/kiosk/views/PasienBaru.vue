<script setup>
/** KSK-08 · Pasien baru — pendaftaran mandiri: NIK → identitas Dukcapil → foto → cetak RM. */
import { ref, computed } from 'vue'
import { Search, ArrowRight, Camera, Printer, House, CircleCheck, UserRound } from 'lucide-vue-next'
import { UiButton } from '@/components/ui'
import KioskFooter from './parts-b/KioskFooter.vue'
import { pasienBaru, langkahPasienBaru } from '../data-b.js'

const langkah = ref(0)

// Langkah 1 · NIK (16 digit)
const nik = ref('')
const errorNik = ref('')
const nikBersih = computed(() => nik.value.replace(/\D/g, '').slice(0, 16))
function cekNik() {
  if (nikBersih.value.length !== 16) {
    errorNik.value = 'NIK harus 16 digit angka.'
    return
  }
  errorNik.value = ''
  langkah.value = 1
}

// Langkah 2 · Identitas — nomor HP boleh diubah
const hp = ref(pasienBaru.hp)
const identitas = [
  ['NIK', pasienBaru.nik],
  ['Nama', pasienBaru.nama],
  ['Tanggal lahir', pasienBaru.lahir],
  ['Jenis kelamin', pasienBaru.kelamin],
  ['Alamat', pasienBaru.alamat],
]

// Langkah 3 · Foto (simulasi kamera)
const fotoDiambil = ref(false)
</script>

<template>
  <p class="k-code">KSK-08 · Anjungan mandiri</p>
  <h1 class="k-title">Daftar pasien baru</h1>

  <ol class="stepper">
    <li
      v-for="(l, i) in langkahPasienBaru"
      :key="l"
      class="stepper__item"
      :class="{ 'stepper__item--aktif': i === langkah, 'stepper__item--selesai': i < langkah }"
    >
      <span class="stepper__no">{{ i < langkah ? '✓' : i + 1 }}</span>
      <span>{{ l }}</span>
    </li>
  </ol>

  <!-- 1 · NIK -->
  <div v-if="langkah === 0" class="panel">
    <p class="panel__judul">Masukkan NIK sesuai KTP</p>
    <input
      v-model="nik"
      class="input k-input"
      inputmode="numeric"
      maxlength="16"
      placeholder="16 digit NIK"
      @keyup.enter="cekNik"
    />
    <p class="panel__teks">{{ nikBersih.length }}/16 digit · data dicocokkan dengan Dukcapil</p>
    <p v-if="errorNik" class="panel__error">{{ errorNik }}</p>
    <UiButton variant="primary" size="lg" :icon="Search" @click="cekNik">Cek NIK</UiButton>
  </div>

  <!-- 2 · Identitas -->
  <div v-else-if="langkah === 1" class="panel">
    <p class="panel__judul">Data ditemukan di Dukcapil</p>
    <dl class="kv">
      <template v-for="[k, v] in identitas" :key="k">
        <dt>{{ k }}</dt>
        <dd>{{ v }}</dd>
      </template>
    </dl>
    <label class="panel__teks" for="hp">Nomor HP untuk notifikasi antrean</label>
    <input id="hp" v-model="hp" class="input k-input" inputmode="tel" />
    <UiButton variant="primary" size="lg" :icon="ArrowRight" :disabled="!hp" @click="langkah = 2">Data Sudah Benar</UiButton>
  </div>

  <!-- 3 · Foto -->
  <div v-else-if="langkah === 2" class="panel">
    <p class="panel__judul">Ambil foto wajah</p>
    <div class="kamera" :class="{ 'kamera--ok': fotoDiambil }">
      <component :is="fotoDiambil ? CircleCheck : UserRound" class="kamera__icon" aria-hidden="true" />
      <p>{{ fotoDiambil ? 'Foto tersimpan' : 'Posisikan wajah di tengah bingkai' }}</p>
    </div>
    <div class="aksi">
      <UiButton size="lg" :icon="Camera" @click="fotoDiambil = true">{{ fotoDiambil ? 'Ambil Ulang' : 'Ambil Foto' }}</UiButton>
      <UiButton variant="primary" size="lg" :icon="ArrowRight" :disabled="!fotoDiambil" @click="langkah = 3">Lanjut</UiButton>
    </div>
  </div>

  <!-- 4 · Cetak RM -->
  <div v-else class="panel panel--sukses">
    <CircleCheck class="sukses__icon" aria-hidden="true" />
    <p class="panel__judul">Pendaftaran berhasil, {{ pasienBaru.nama }}</p>
    <div class="hasil">
      <div><span>Nomor RM baru</span><strong>{{ pasienBaru.rmBaru }}</strong></div>
      <div><span>Antrean registrasi</span><strong>{{ pasienBaru.antreanRegistrasi }}</strong></div>
    </div>
    <p class="panel__teks">Kartu pasien dan tiket antrean sedang dicetak. Tunjukkan ke loket pendaftaran.</p>
    <div class="aksi">
      <UiButton size="lg" :icon="Printer">Cetak Ulang</UiButton>
      <UiButton variant="primary" size="lg" :icon="House" to="/kiosk/selamat-datang">Selesai</UiButton>
    </div>
  </div>

  <KioskFooter />
</template>

<style scoped>
.k-code { font-size: 14px; color: var(--c-muted); }
.k-title { font-size: 40px; font-weight: 600; line-height: 1.3; }
.stepper { display: flex; gap: 12px; list-style: none; padding: 0; margin: 0; }
.stepper__item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  font-size: 18px;
  color: var(--c-muted);
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.stepper__no {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  font-weight: 600;
  background: var(--c-bg);
  border-radius: 50%;
}
.stepper__item--aktif { color: var(--c-primary); border-color: var(--c-primary); font-weight: 600; }
.stepper__item--aktif .stepper__no { color: #fff; background: var(--c-primary); }
.stepper__item--selesai { color: var(--c-success); }
.stepper__item--selesai .stepper__no { color: var(--c-success); background: var(--c-success-soft); }
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.panel--sukses { align-items: center; text-align: center; }
.panel__judul { font-size: 26px; font-weight: 600; }
.panel__teks { font-size: 16px; color: var(--c-muted); }
.panel__error { font-size: 16px; color: var(--c-danger); }
.k-input { min-height: 64px; font-size: 28px; letter-spacing: 0.04em; }
.kv { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 12px 16px; margin: 0; font-size: 20px; }
.kv dt { color: var(--c-muted); }
.kv dd { margin: 0; font-weight: 600; }
.kamera {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 320px;
  font-size: 18px;
  color: var(--c-muted);
  background: var(--c-bg);
  border: 2px dashed var(--c-border);
  border-radius: var(--r-lg);
}
.kamera--ok { color: var(--c-success); background: var(--c-success-soft); border-color: var(--c-success); }
.kamera__icon { width: 96px; height: 96px; }
.sukses__icon { width: 72px; height: 72px; color: var(--c-success); }
.hasil { display: flex; gap: 16px; width: 100%; }
.hasil div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  background: var(--c-primary-soft);
  border-radius: var(--r-md);
}
.hasil span { font-size: 16px; color: var(--c-muted); }
.hasil strong { font-size: 40px; font-weight: 600; color: var(--c-primary); }
.aksi { display: flex; gap: 16px; width: 100%; }
.aksi > * { flex: 1; }
@media (max-width: 700px) {
  .k-title { font-size: 30px; }
  .stepper { flex-wrap: wrap; }
  .stepper__item { flex: 1 1 40%; font-size: 15px; }
  .kv { grid-template-columns: 1fr; gap: 4px; }
  .kv dd { margin-bottom: 8px; }
  .hasil,
  .aksi { flex-direction: column; }
}
</style>
