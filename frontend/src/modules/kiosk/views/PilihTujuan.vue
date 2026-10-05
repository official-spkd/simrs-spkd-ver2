<script setup>
/** KSK-05 · Pilih tujuan — pasien memilih poli lalu mencetak antrean. */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { HeartPulse, Baby, Brain, Eye, Stethoscope, CalendarCheck, Printer, BadgeCheck } from 'lucide-vue-next'
import { UiButton } from '@/components/ui'
import KioskFooter from './parts-b/KioskFooter.vue'
import { pasienCheckin, bookingHariIni, daftarPoli } from '../data-b.js'

const ikonPoli = { baby: Baby, brain: Brain, eye: Eye, stethoscope: Stethoscope }
const ikon = (p) => ikonPoli[p.ikon] ?? HeartPulse

const router = useRouter()
const dipilih = ref(bookingHariIni.poli)
const poliBooking = computed(() => daftarPoli.find((p) => p.key === bookingHariIni.poli))

function konfirmasi() {
  router.push({ path: '/kiosk/check-in-berhasil', query: { poli: dipilih.value } })
}
</script>

<template>
  <p class="k-code">KSK-05 · Anjungan mandiri</p>
  <h1 class="k-title">Pilih tujuan layanan</h1>

  <div class="pasien">
    <div class="grow">
      <p class="pasien__nama">{{ pasienCheckin.nama }}</p>
      <p class="pasien__id">NIK {{ pasienCheckin.nik }} · IHS {{ pasienCheckin.ihs }}</p>
    </div>
    <span v-if="pasienCheckin.ihsAktif" class="pasien__status">
      <BadgeCheck class="pasien__status-icon" aria-hidden="true" /> Satu Sehat aktif
    </span>
  </div>

  <button
    v-if="poliBooking"
    type="button"
    class="booking"
    :class="{ 'booking--aktif': dipilih === poliBooking.key }"
    @click="dipilih = poliBooking.key"
  >
    <CalendarCheck class="booking__icon" aria-hidden="true" />
    <span class="grow">
      <span class="booking__judul">Booking hari ini · {{ poliBooking.nama }}</span>
      <span class="booking__teks">
        {{ poliBooking.dokter }} · {{ bookingHariIni.tanggal }} · {{ bookingHariIni.jam }} · {{ bookingHariIni.penjamin }}
      </span>
    </span>
  </button>

  <p class="k-label">Atau pilih poli lain yang buka hari ini</p>
  <div class="poli" role="radiogroup" aria-label="Daftar poli">
    <button
      v-for="p in daftarPoli"
      :key="p.key"
      type="button"
      role="radio"
      :aria-checked="dipilih === p.key"
      class="poli__item"
      :class="{ 'poli__item--aktif': dipilih === p.key }"
      @click="dipilih = p.key"
    >
      <component :is="ikon(p)" class="poli__icon" aria-hidden="true" />
      <span class="grow">
        <span class="poli__nama">{{ p.nama }}</span>
        <span class="poli__teks">{{ p.dokter }} · {{ p.jam }}</span>
      </span>
      <span class="poli__kuota">
        <span class="poli__sisa">Sisa {{ p.sisa }}</span>
        <span class="poli__bar"><span :style="{ width: `${(p.sisa / p.kuota) * 100}%` }" /></span>
        <span class="poli__teks">dari {{ p.kuota }} kuota</span>
      </span>
    </button>
  </div>

  <UiButton variant="primary" size="lg" block :icon="Printer" @click="konfirmasi">Konfirmasi &amp; Cetak Antrean</UiButton>

  <KioskFooter back="/kiosk/konfirmasi-identitas" />
</template>

<style scoped>
.k-code { font-size: 14px; color: var(--c-muted); }
.k-title { font-size: 40px; font-weight: 600; line-height: 1.3; color: var(--c-text); }
.k-label { font-size: 20px; font-weight: 600; }
.pasien {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.pasien__nama { font-size: 24px; font-weight: 600; }
.pasien__id { font-size: 16px; color: var(--c-muted); }
.pasien__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-success);
  background: var(--c-success-soft);
  border-radius: var(--r-pill);
}
.pasien__status-icon { width: 16px; height: 16px; }
.booking,
.poli__item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 20px;
  font: inherit;
  color: var(--c-text);
  text-align: left;
  background: #fff;
  border: 2px solid var(--c-border);
  border-radius: var(--r-md);
  cursor: pointer;
}
.booking { background: var(--c-primary-soft); border-color: transparent; }
.booking--aktif,
.poli__item--aktif { border-color: var(--c-primary); }
.poli__item--aktif { background: var(--c-primary-soft); }
.booking__icon { width: 32px; height: 32px; color: var(--c-primary); flex-shrink: 0; }
.booking__judul,
.poli__nama { display: block; font-size: 22px; font-weight: 600; }
.booking__teks,
.poli__teks { display: block; font-size: 16px; color: var(--c-muted); }
.poli { display: flex; flex-direction: column; gap: 12px; }
.poli__icon { width: 32px; height: 32px; color: var(--c-primary); flex-shrink: 0; }
.poli__kuota { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; width: 140px; flex-shrink: 0; }
.poli__sisa { font-size: 18px; font-weight: 600; color: var(--c-success); }
.poli__bar { width: 100%; height: 8px; background: var(--c-bg); border-radius: var(--r-pill); overflow: hidden; }
.poli__bar span { display: block; height: 100%; background: var(--c-success); }
@media (max-width: 700px) {
  .k-title { font-size: 30px; }
  .pasien { flex-wrap: wrap; }
  .poli__item { flex-wrap: wrap; }
  .poli__kuota { width: 100%; align-items: flex-start; }
}
</style>
