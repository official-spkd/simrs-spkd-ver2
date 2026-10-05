<script setup>
/** KSK-07 · Pembayaran — rincian tagihan dan QRIS dengan batas waktu. */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { QrCode, CircleCheck, RefreshCw, House } from 'lucide-vue-next'
import { UiButton } from '@/components/ui'
import KioskFooter from './parts-b/KioskFooter.vue'
import { formatRupiah } from '@/utils/format'
import { tagihan, ukuranQr, modulQrAktif } from '../data-b.js'

const total = tagihan.rincian.reduce((s, r) => s + r.nilai, 0)

// Status: 'menunggu' | 'lunas' | 'kedaluwarsa'
const status = ref('menunggu')
const sisaDetik = ref(tagihan.batasDetik)
let timer = null

function mulaiHitung() {
  clearInterval(timer)
  sisaDetik.value = tagihan.batasDetik
  status.value = 'menunggu'
  timer = setInterval(() => {
    sisaDetik.value -= 1
    if (sisaDetik.value <= 0) {
      clearInterval(timer)
      status.value = 'kedaluwarsa'
    }
  }, 1000)
}
onMounted(mulaiHitung)
onBeforeUnmount(() => clearInterval(timer))

const sisaWaktu = computed(() => {
  const m = Math.floor(sisaDetik.value / 60)
  const d = sisaDetik.value % 60
  return `${String(m).padStart(2, '0')}:${String(d).padStart(2, '0')}`
})

function sudahBayar() {
  clearInterval(timer)
  status.value = 'lunas'
}

const modul = Array.from({ length: ukuranQr * ukuranQr }, (_, i) =>
  modulQrAktif(Math.floor(i / ukuranQr), i % ukuranQr),
)
</script>

<template>
  <p class="k-code">KSK-07 · Anjungan mandiri</p>
  <h1 class="k-title">Pembayaran</h1>

  <div class="pasien">
    <span class="pasien__label">{{ tagihan.label }}</span>
    <p class="pasien__nama">{{ tagihan.nama }}</p>
    <p class="pasien__id">RM {{ tagihan.rm }} · NIK {{ tagihan.nik }} · IHS {{ tagihan.ihs }}</p>
  </div>

  <div class="bayar">
    <div class="rincian">
      <p class="rincian__judul">Rincian tagihan</p>
      <div v-for="r in tagihan.rincian" :key="r.label" class="rincian__baris">
        <span>{{ r.label }}</span>
        <span>{{ formatRupiah(r.nilai) }}</span>
      </div>
      <div class="rincian__baris rincian__total">
        <span>Total</span>
        <span>{{ formatRupiah(total) }}</span>
      </div>
      <p class="rincian__kode">Kode tagihan {{ tagihan.kode }}</p>
    </div>

    <div class="qris">
      <template v-if="status === 'lunas'">
        <CircleCheck class="qris__ok" aria-hidden="true" />
        <p class="qris__judul">Pembayaran berhasil</p>
        <p class="qris__teks">Bukti bayar dicetak. Terima kasih.</p>
      </template>
      <template v-else>
        <p class="qris__judul"><QrCode class="qris__icon" aria-hidden="true" /> Bayar dengan QRIS</p>
        <div class="qr" :class="{ 'qr--mati': status === 'kedaluwarsa' }" role="img" aria-label="Kode QR ilustrasi">
          <span v-for="(aktif, i) in modul" :key="i" :class="{ on: aktif }" />
        </div>
        <p v-if="status === 'kedaluwarsa'" class="qris__teks qris__teks--danger">QR kedaluwarsa. Buat QR baru untuk membayar.</p>
        <p v-else class="qris__teks">Pindai dengan aplikasi bank/e-wallet · berlaku <strong>{{ sisaWaktu }}</strong></p>
      </template>
    </div>
  </div>

  <div class="aksi">
    <UiButton v-if="status === 'lunas'" variant="primary" size="lg" :icon="House" to="/kiosk/selamat-datang">Selesai</UiButton>
    <UiButton v-else-if="status === 'kedaluwarsa'" variant="primary" size="lg" :icon="RefreshCw" @click="mulaiHitung">Buat QR Baru</UiButton>
    <UiButton v-else variant="primary" size="lg" :icon="CircleCheck" @click="sudahBayar">Saya Sudah Bayar</UiButton>
  </div>

  <KioskFooter />
</template>

<style scoped>
.k-code { font-size: 14px; color: var(--c-muted); }
.k-title { font-size: 40px; font-weight: 600; line-height: 1.3; }
.pasien {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.pasien__label {
  align-self: flex-start;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-warning);
  background: var(--c-warning-soft);
  border-radius: var(--r-pill);
}
.pasien__nama { font-size: 24px; font-weight: 600; }
.pasien__id { font-size: 16px; color: var(--c-muted); }
.bayar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
.rincian,
.qris {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.rincian__judul,
.qris__judul { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 600; }
.rincian__baris { display: flex; justify-content: space-between; gap: 12px; font-size: 18px; }
.rincian__total { padding-top: 14px; border-top: 1px solid var(--c-border); font-size: 24px; font-weight: 600; color: var(--c-primary); }
.rincian__kode { margin-top: auto; font-size: 14px; color: var(--c-muted); }
.qris { align-items: center; text-align: center; }
.qris__icon { width: 24px; height: 24px; color: var(--c-primary); }
.qris__ok { width: 96px; height: 96px; margin-top: 24px; color: var(--c-success); }
.qris__teks { font-size: 16px; color: var(--c-muted); }
.qris__teks--danger { color: var(--c-danger); }
.qr {
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  gap: 2px;
  width: 100%;
  max-width: 260px;
  aspect-ratio: 1;
  padding: 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
}
.qr span.on { background: var(--c-text); border-radius: 2px; }
.qr--mati { opacity: 0.25; }
.aksi { display: flex; }
.aksi > * { flex: 1; }
@media (max-width: 700px) {
  .k-title { font-size: 30px; }
  .bayar { grid-template-columns: 1fr; }
}
</style>
