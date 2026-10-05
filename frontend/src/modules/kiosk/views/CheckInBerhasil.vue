<script setup>
/** KSK-06 · Check-in berhasil — tiket antrean untuk poli yang dipilih di KSK-05. */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { CircleCheck, Printer, House } from 'lucide-vue-next'
import { UiButton } from '@/components/ui'
import KioskFooter from './parts-b/KioskFooter.vue'
import { pasienCheckin, bookingHariIni, daftarPoli } from '../data-b.js'

const route = useRoute()
// Tanpa query → pakai poli booking hari ini
const poli = computed(
  () => daftarPoli.find((p) => p.key === route.query.poli) ?? daftarPoli.find((p) => p.key === bookingHariIni.poli),
)
// Nomor antrean berikutnya = kuota terpakai + 1
const nomor = computed(() => `${poli.value.prefix}-${String(poli.value.kuota - poli.value.sisa + 1).padStart(2, '0')}`)

const dicetakUlang = ref(false)
</script>

<template>
  <p class="k-code">KSK-06 · Anjungan mandiri</p>

  <div class="sukses">
    <CircleCheck class="sukses__icon" aria-hidden="true" />
    <h1 class="k-title">Check-in berhasil</h1>
    <p class="k-sub">Silakan ambil tiket antrean Anda, {{ pasienCheckin.nama }}.</p>
  </div>

  <div class="tiket">
    <p class="tiket__label">Nomor antrean</p>
    <p class="tiket__nomor">{{ nomor }}</p>
    <p class="tiket__poli">{{ poli.nama }} · {{ poli.dokter }}</p>
    <div class="tiket__rincian">
      <div><span>Lokasi</span><strong>{{ poli.lokasi }}</strong></div>
      <div><span>Sedang dilayani</span><strong>{{ poli.dilayani }}</strong></div>
      <div><span>Estimasi tunggu</span><strong>± {{ poli.tunggu }} menit</strong></div>
      <div><span>Penjamin</span><strong>{{ bookingHariIni.penjamin }}</strong></div>
    </div>
  </div>

  <p v-if="dicetakUlang" class="info">Tiket dicetak ulang. Silakan ambil di bawah layar.</p>

  <div class="aksi">
    <UiButton size="lg" :icon="Printer" @click="dicetakUlang = true">Cetak Ulang Tiket</UiButton>
    <UiButton variant="primary" size="lg" :icon="House" to="/kiosk/selamat-datang">Selesai</UiButton>
  </div>

  <KioskFooter back="/kiosk/pilih-tujuan" />
</template>

<style scoped>
.k-code { font-size: 14px; color: var(--c-muted); }
.sukses { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.sukses__icon { width: 72px; height: 72px; color: var(--c-success); }
.k-title { font-size: 48px; font-weight: 600; line-height: 1.3; }
.k-sub { font-size: 22px; color: var(--c-muted); }
.tiket {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  background: #fff;
  border: 2px dashed var(--c-border);
  border-radius: var(--r-lg);
  text-align: center;
}
.tiket__label { font-size: 18px; color: var(--c-muted); }
.tiket__nomor { font-size: 120px; font-weight: 600; line-height: 1.1; color: var(--c-primary); }
.tiket__poli { font-size: 24px; font-weight: 600; }
.tiket__rincian {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  margin-top: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--c-border);
  text-align: left;
}
.tiket__rincian div { display: flex; flex-direction: column; gap: 4px; }
.tiket__rincian span { font-size: 16px; color: var(--c-muted); }
.tiket__rincian strong { font-size: 20px; font-weight: 600; }
.info {
  padding: 16px 20px;
  font-size: 18px;
  color: var(--c-success);
  background: var(--c-success-soft);
  border-radius: var(--r-md);
}
.aksi { display: flex; gap: 16px; }
.aksi > * { flex: 1; }
@media (max-width: 700px) {
  .k-title { font-size: 34px; }
  .tiket__nomor { font-size: 80px; }
  .tiket__rincian { grid-template-columns: 1fr; }
  .aksi { flex-direction: column; }
}
</style>
