<script setup>
/** BLG-04 · Billing — Pembayaran */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiButton, UiCard, FormField } from '@/components/ui'
import { formatJam, formatRupiah } from '@/utils/format'
import SegTabs from './parts-a/SegTabs.vue'
import RupiahInput from './parts-a/RupiahInput.vue'
import { tagihan, rincianBayar, pasienBayar, catatanBayar, kasir, tabMetodeBayar, bankVa } from '../data-a'

const route = useRoute()
const router = useRouter()

// Tagihan yang dibayar: ?id=, default INV-008 (pembayaran umum sesuai desain)
const inv = computed(() => tagihan.find((r) => r.id === route.query.id) || tagihan.find((r) => r.id === 'INV-008'))
const rincian = computed(() => rincianBayar[inv.value.id] || [{ id: 1, layanan: 'Layanan', jumlah: inv.value.total }])
const pasien = computed(
  () => pasienBayar[inv.value.id] || { nama: inv.value.nama, identitas: `NIK ${inv.value.nik} · IHS P0XXXXXXXXXX` },
)
const total = computed(() => rincian.value.reduce((s, r) => s + r.jumlah, 0))

const metode = ref('Tunai')
const diterima = ref(300000)
const uangEl = ref(null)
const bank = ref(bankVa[0])
const kodeBayar = ref('')
const lunas = ref(inv.value.status === 'Lunas')
const metodeLunas = ref('Tunai')
const hasil = ref(null)
const galat = ref('')

const kembalian = computed(() => Math.max(0, diterima.value - total.value))
const cukup = computed(() => diterima.value >= total.value)

function gantiMetode() {
  kodeBayar.value = ''
  galat.value = ''
}

function terbitkanKode() {
  const no = inv.value.id.replace(/\D/g, '')
  kodeBayar.value = metode.value === 'QRIS' ? `QRIS-20250514-${no}` : `8808${no.padStart(4, '0')}31XXXX ${bank.value}`
}

function konfirmasi() {
  galat.value = ''
  if (metode.value === 'Tunai' && !cukup.value) {
    galat.value = `Nominal kurang ${formatRupiah(total.value - diterima.value)}.`
    uangEl.value?.focus()
    return
  }
  if (metode.value !== 'Tunai' && !kodeBayar.value) {
    galat.value = `Terbitkan kode ${metode.value} terlebih dahulu.`
    return
  }
  const d = new Date()
  const waktu = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })} ${formatJam(d)} WIB`
  lunas.value = true
  metodeLunas.value = metode.value
  hasil.value =
    metode.value === 'Tunai'
      ? `Tunai ${formatRupiah(diterima.value)} · kembali ${formatRupiah(kembalian.value)} · ${waktu}`
      : `${metode.value} ${formatRupiah(total.value)} · ${kodeBayar.value} · ${waktu}`
}

function keKwitansi() {
  router.push({ path: '/billing/kwitansi', query: { id: inv.value.id } })
}

// F6 fokus uang diterima · F8 cetak kwitansi
function onKey(e) {
  if (e.key === 'F6') {
    e.preventDefault()
    metode.value = 'Tunai'
    uangEl.value?.focus()
  } else if (e.key === 'F8' && lunas.value) {
    e.preventDefault()
    keKwitansi()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <PageHeader />

    <UiAlert
      tone="info"
      :title="`Pembayaran ${inv.penjamin.toLowerCase()} · ${pasien.nama}`"
      :text="`${inv.id} · ${pasien.identitas}${inv.id === 'INV-008' ? ` · ${catatanBayar}` : ''}`"
    />

    <SegTabs v-model="metode" :tabs="tabMetodeBayar" @update:model-value="gantiMetode" />

    <div class="row bayar__main">
      <UiCard class="grow" :title="metode === 'Tunai' ? 'Penerimaan tunai' : `Penerimaan ${metode}`">
        <FormField label="Tagihan final">
          <input class="input bayar__ro" :value="formatRupiah(total)" readonly />
        </FormField>

        <template v-if="metode === 'Tunai'">
          <FormField label="Uang diterima * · F6" :error="galat">
            <RupiahInput ref="uangEl" v-model="diterima" :class="{ 'input--error': galat }" :readonly="lunas" />
          </FormField>
          <div class="field">
            <span class="field__label">Kembalian otomatis</span>
            <input class="input bayar__ro" :value="formatRupiah(kembalian)" readonly />
            <span v-if="cukup" class="t-xs t-success">✓ Nominal diterima mencukupi</span>
            <span v-else class="t-xs t-danger">Nominal kurang {{ formatRupiah(total - diterima) }}</span>
          </div>
        </template>

        <template v-else>
          <FormField v-if="metode === 'Virtual Account'" label="Bank">
            <select v-model="bank" class="select" :disabled="lunas" @change="kodeBayar = ''">
              <option v-for="b in bankVa" :key="b">{{ b }}</option>
            </select>
          </FormField>
          <FormField :label="metode === 'QRIS' ? 'ID transaksi QRIS' : 'Nomor virtual account'" :error="galat">
            <input class="input bayar__ro" :value="kodeBayar || 'Belum diterbitkan'" readonly />
          </FormField>
          <div><UiButton :disabled="lunas" @click="terbitkanKode">Terbitkan kode {{ metode }}</UiButton></div>
        </template>

        <div><UiButton variant="primary" :disabled="lunas" @click="konfirmasi">Konfirmasi pembayaran</UiButton></div>
        <UiAlert v-if="hasil" tone="success" title="Pembayaran berhasil" :text="hasil" />
      </UiCard>

      <section class="card bayar__sum">
        <h3 class="t-title">Ringkasan {{ inv.id }}</h3>
        <dl class="sum__list">
          <div v-for="r in rincian" :key="r.id" class="sum__row">
            <dt>{{ r.layanan }}</dt>
            <dd>{{ formatRupiah(r.jumlah) }}</dd>
          </div>
        </dl>
        <p class="sum__total">Total {{ formatRupiah(total) }}</p>
        <span v-if="lunas" class="badge badge--success">Lunas · {{ metodeLunas }}</span>
        <span v-else class="badge badge--warning">Menunggu pembayaran</span>
        <div><UiButton :disabled="!lunas" @click="keKwitansi">Cetak kwitansi</UiButton></div>
        <p class="t-sm t-muted">Kasir: {{ kasir.nama }} · {{ kasir.loket }} F8 cetak · Tab pindah isian</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bayar__sum { width: 380px; flex-shrink: 0; align-items: flex-start; }
.bayar__ro[readonly] { background: var(--c-surface); }
.sum__list { margin: 0; width: 100%; display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.sum__row { display: flex; justify-content: space-between; gap: 12px; }
.sum__row dt, .sum__row dd { margin: 0; }
.sum__total { font-size: 32px; font-weight: 600; line-height: 1.3; }
@media (max-width: 1100px) {
  .bayar__main { flex-direction: column; }
  .bayar__main > * { width: 100%; }
}
</style>
