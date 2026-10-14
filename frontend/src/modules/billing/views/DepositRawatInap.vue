<script setup>
/** BLG-03 · Billing — Deposit rawat inap */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiButton, UiCard, StatCard, FormField, DataTable } from '@/components/ui'
import { formatJam, formatRupiah, useNow } from '@/utils/format'
import RupiahInput from './parts-a/RupiahInput.vue'
import { pasienDeposit, riwayatDepositAwal, opsiKelas, opsiMetode, formDepositAwal } from '../data-a'

const now = useNow()
const riwayat = ref(riwayatDepositAwal.map((r) => ({ ...r })))
const form = reactive({ ...formDepositAwal })
const errors = reactive({})
const hasil = ref(null)
const selected = ref(1)

const masuk = computed(() => riwayat.value.filter((r) => r.nominal > 0).reduce((s, r) => s + r.nominal, 0))
const terpakai = computed(() => riwayat.value.filter((r) => r.nominal < 0).reduce((s, r) => s - r.nominal, 0))
const saldo = computed(() => masuk.value - terpakai.value)
const saldoSetelah = computed(() => saldo.value + (form.topup || 0))

const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)
const stats = computed(() => [
  { label: 'Deposit masuk', value: formatRupiah(masuk.value) },
  { label: 'Terpakai', value: formatRupiah(terpakai.value) },
  { label: 'Saldo tersedia', value: formatRupiah(saldo.value) },
])

// Saldo berjalan per baris riwayat
const rows = computed(() => {
  let s = 0
  return riwayat.value.map((r) => ({ ...r, saldo: (s += r.nominal) }))
})
const tandaNominal = (v) => `${v < 0 ? '−' : '+'}${formatRupiah(Math.abs(v))}`
const columns = [
  { key: 'tanggal', label: 'Tanggal', strong: true },
  { key: 'transaksi', label: 'Transaksi' },
  { key: 'nominal', label: 'Nominal', format: tandaNominal },
  { key: 'saldo', label: 'Saldo', format: formatRupiah },
]

function simpan() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.topup || form.topup < 10000) errors.topup = 'Nominal top-up minimal Rp10.000.'
  if (!form.alasan.trim()) errors.alasan = 'Alasan / catatan wajib diisi.'
  if (Object.keys(errors).length) {
    hasil.value = { tone: 'danger', title: 'Deposit belum dapat disimpan', text: 'Lengkapi isian bertanda *.' }
    return
  }
  const d = new Date()
  const tanggal = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })} ${formatJam(d)}`
  const id = riwayat.value.length + 1
  riwayat.value.push({ id, tanggal, transaksi: `Top-up · ${form.metode}`, nominal: form.topup })
  selected.value = id
  hasil.value = {
    tone: 'success',
    title: 'Deposit tersimpan',
    text: `Top-up ${formatRupiah(form.topup)} (${form.metode}) · saldo kini ${formatRupiah(saldo.value)}${
      form.naikKelas !== opsiKelas[0] ? ` · naik kelas: ${form.naikKelas}` : ''
    }.`,
  }
  form.topup = 0
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="row dep__stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <div class="row dep__main">
      <UiCard class="grow" title="Top-up / naik kelas">
        <UiAlert tone="info" :title="pasienDeposit.title" :text="pasienDeposit.text" />
        <div class="grid-2">
          <FormField label="Kelas saat ini">
            <input v-model="form.kelasSaatIni" class="input dep__ro" readonly />
          </FormField>
          <FormField label="Naik kelas">
            <select v-model="form.naikKelas" class="select">
              <option v-for="k in opsiKelas" :key="k">{{ k }}</option>
            </select>
          </FormField>
          <FormField label="Top-up" required :error="errors.topup">
            <RupiahInput v-model="form.topup" :class="{ 'input--error': errors.topup }" />
          </FormField>
          <FormField label="Metode">
            <select v-model="form.metode" class="select">
              <option v-for="m in opsiMetode" :key="m">{{ m }}</option>
            </select>
          </FormField>
        </div>
        <p class="t-body">Saldo setelah top-up: {{ formatRupiah(saldoSetelah) }}</p>
        <FormField label="Alasan / catatan" required :error="errors.alasan">
          <input v-model="form.alasan" class="input" :class="{ 'input--error': errors.alasan }" />
        </FormField>
        <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text" />
        <div><UiButton variant="primary" @click="simpan">Simpan deposit</UiButton></div>
      </UiCard>

      <div class="stack dep__side">
        <DataTable
          v-model:selected="selected"
          title="Riwayat deposit"
          :columns="columns"
          :rows="rows"
          selectable
          :searchable="false"
          :filterable="false"
          :exportable="false"
          :paginated="false"
        />
        <UiAlert tone="info" title="Audit saldo" text="Deposit masuk dikurangi penggunaan sama dengan saldo tersedia." />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dep__side { width: 440px; flex-shrink: 0; }
.dep__side :deep(.dt__table) { min-width: 0; }
/* Isian baca-saja tetap putih seperti desain */
.dep__ro[readonly] { background: var(--c-surface); }
@media (max-width: 1100px) {
  .dep__stats { flex-wrap: wrap; }
  .dep__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .dep__main { flex-direction: column; }
  .dep__main > * { width: 100%; }
}
</style>
