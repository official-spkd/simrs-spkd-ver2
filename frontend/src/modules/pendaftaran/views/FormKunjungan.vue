<script setup>
/** PDR-04 · Pendaftaran — Form Kunjungan */
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Printer } from 'lucide-vue-next'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, DataTable, FormField } from '@/components/ui'
import { formatRupiah } from '@/utils/format'
import StepTabs from './parts-a/StepTabs.vue'
import BannerPasien from './parts-a/BannerPasien.vue'
import {
  langkahKunjungan,
  pasienKunjungan,
  pasienTerdaftar,
  opsiPenjaminKunjungan,
  jadwalPoli,
  katalogAdmisi,
} from '../data-a'

const route = useRoute()

// Pasien dari ?id= / ?rm= (hasil Cari Pasien / Pasien Baru); default Budi Santoso
const pasien = computed(() => {
  const p = pasienTerdaftar.find((x) => String(x.id) === String(route.query.id) || x.rm === route.query.rm)
  if (!p || p.id === 1) return pasienKunjungan
  return {
    ...pasienKunjungan,
    nama: p.nama,
    umur: p.umur,
    rm: p.rm,
    nik: p.nik,
    ihs: p.ihs.startsWith('✓') ? p.ihs.slice(2) : '',
    jenisKelamin: '—',
    alergi: '',
    kunjunganTerakhir: '',
  }
})

const langkah = ref(4)
const tabs = computed(() =>
  langkahKunjungan.map((t) => ({ ...t, label: t.key < langkah.value ? `✓ ${t.label}` : t.label })),
)

const penjaminKey = ref('bpjs')
const poliKey = ref('jantung')
const admisi = reactive(katalogAdmisi.map((a) => ({ ...a })))
const tersimpan = ref(false)

const penjamin = computed(() => opsiPenjaminKunjungan.find((p) => p.key === penjaminKey.value))
const jadwal = computed(() => jadwalPoli.find((j) => j.key === poliKey.value))
const nomorAntrean = computed(() => `${jadwal.value.prefix}-${String(jadwal.value.nomor).padStart(2, '0')}`)
const dipilih = computed(() =>
  admisi.filter((a) => a.dipilih).map((a) => ({ ...a, subtotal: a.jumlah * a.tarif })),
)
const biaya = computed(() => dipilih.value.reduce((s, a) => s + a.subtotal, 0))
const ditanggung = computed(() => (penjamin.value.ditanggung ? biaya.value : 0))
const bayarPasien = computed(() => biaya.value - ditanggung.value)
const valid = computed(() => !!penjamin.value && !!jadwal.value && jadwal.value.sisa > 0 && dipilih.value.length > 0)

const columns = [
  { key: 'item', label: 'Item', strong: true },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'tarif', label: 'Tarif', format: (v) => formatRupiah(v) },
  { key: 'subtotal', label: 'Subtotal', format: (v) => formatRupiah(v) },
]

// Hapus centang di ringkasan → item keluar dari daftar dipilih
function toggleAdmisi(id) {
  const a = admisi.find((x) => x.id === id)
  if (a) a.dipilih = !a.dipilih
}

function simpanCetak() {
  if (!valid.value) return
  tersimpan.value = true
  window.print()
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <BannerPasien
      :pasien="pasien"
      :penjamin="penjamin.ditanggung ? 'BPJS Kelas 2' : 'Umum'"
      :status="`${nomorAntrean} · ${jadwal.poli}`"
    />

    <StepTabs v-model="langkah" :tabs="tabs" />

    <div class="row fk__main">
      <div class="stack grow">
        <!-- Langkah 1 · Penjamin -->
        <UiCard v-if="langkah === 1" title="Penjamin">
          <FormField label="Penjamin" required>
            <select v-model="penjaminKey" class="select">
              <option v-for="p in opsiPenjaminKunjungan" :key="p.key" :value="p.key">{{ p.label }}</option>
            </select>
          </FormField>
          <div class="row gap-8">
            <UiButton v-if="penjamin.ditanggung" to="/pendaftaran/panel-bpjs">Cek eligibilitas &amp; SEP</UiButton>
            <UiButton variant="primary" @click="langkah = 2">Lanjut</UiButton>
          </div>
        </UiCard>

        <!-- Langkah 2 · Poli/Dokter -->
        <UiCard v-if="langkah === 2" title="Poli / dokter">
          <FormField label="Poli · dokter · jam praktik" required>
            <select v-model="poliKey" class="select">
              <option v-for="j in jadwalPoli" :key="j.key" :value="j.key" :disabled="j.sisa === 0">
                {{ j.poli }} · {{ j.dokter }} · {{ j.jam }} · sisa {{ j.sisa }} / {{ j.kuota }}
              </option>
            </select>
          </FormField>
          <div class="row gap-8">
            <UiButton to="/pendaftaran/jadwal-dokter">Lihat jadwal dokter</UiButton>
            <UiButton variant="primary" @click="langkah = 3">Lanjut</UiButton>
          </div>
        </UiCard>

        <!-- Langkah 3 · Tindakan Admisi -->
        <UiCard v-if="langkah === 3" title="Tindakan admisi">
          <label v-for="a in admisi" :key="a.id" class="check">
            <input v-model="a.dipilih" type="checkbox" />
            <span>{{ a.item }} · {{ formatRupiah(a.tarif) }}</span>
          </label>
          <div><UiButton variant="primary" @click="langkah = 4">Lanjut ke ringkasan</UiButton></div>
        </UiCard>

        <!-- Langkah 4 · Ringkasan/Cetak -->
        <template v-if="langkah === 4">
          <UiCard title="Ringkasan kunjungan">
            <div class="row fk__ringkas">
              <div class="stack grow">
                <p class="t-sm t-muted">Penjamin &amp; SEP</p>
                <p class="t-strong">{{ penjamin.label }}</p>
                <p class="t-sm">
                  {{ penjamin.sep || 'Tanpa SEP' }} PRB: {{ penjamin.prb }} · Selisih: {{ formatRupiah(penjamin.selisih) }}
                </p>
                <div><UiButton @click="langkah = 1">Ubah penjamin / Cetak SEP</UiButton></div>
              </div>
              <div class="stack grow">
                <p class="t-sm t-muted">Poli / dokter</p>
                <p class="t-strong">{{ jadwal.poli }} · {{ jadwal.dokter }}</p>
                <p class="t-sm">14 Mei 2025 · {{ jadwal.jam }} Kuota sisa {{ jadwal.sisa }} / {{ jadwal.kuota }}</p>
                <div><UiButton @click="langkah = 2">Ubah poli / dokter</UiButton></div>
              </div>
            </div>
          </UiCard>

          <DataTable
            title="Tindakan admisi dipilih"
            :columns="columns"
            :rows="dipilih"
            :selected="dipilih[0]?.id"
            selectable
            :searchable="false"
            :exportable="false"
            :filterable="false"
            :paginated="false"
          >
            <template #cell-item="{ row }">
              <label class="check t-strong" @click.stop>
                <input type="checkbox" checked @change="toggleAdmisi(row.id)" />
                {{ row.item }}
              </label>
            </template>
          </DataTable>

          <UiAlert
            v-if="valid"
            tone="success"
            title="Validasi kunjungan selesai"
            text="Identitas cocok · SEP dibuat · Jadwal aktif · Antrean siap dicetak"
          />
          <UiAlert v-else tone="warning" title="Kunjungan belum valid" text="Pilih minimal satu tindakan admisi dan jadwal yang masih memiliki kuota." />
        </template>
      </div>

      <UiCard class="fk__side" title="Nomor antrean">
        <p class="fk__nomor">{{ nomorAntrean }}</p>
        <p class="t-center">{{ pasien.nama }} {{ jadwal.poli }} · {{ jadwal.lantai }}</p>
        <p class="t-sm">
          Biaya admisi {{ formatRupiah(biaya) }} Ditanggung BPJS {{ formatRupiah(ditanggung) }} Bayar pasien
          {{ formatRupiah(bayarPasien) }}
        </p>
        <div>
          <UiBadge :tone="tersimpan ? 'success' : 'warning'">Encounter · {{ tersimpan ? 'Terkirim' : 'Antrian' }}</UiBadge>
        </div>
        <div><UiButton variant="primary" :icon="Printer" :disabled="!valid" @click="simpanCetak">Simpan &amp; Cetak</UiButton></div>
      </UiCard>
    </div>

    <div class="row-between fk__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row gap-8">
        <UiButton @click="langkah = 3">Kembali ke Admisi</UiButton>
        <UiButton variant="primary" :disabled="!valid" @click="simpanCetak">Simpan &amp; Cetak</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fk__main { width: 100%; }
.fk__side { width: 300px; flex-shrink: 0; }
.fk__nomor { font-size: 72px; font-weight: 600; line-height: 1.45; color: var(--c-primary); text-align: center; }
.fk__actions { width: 100%; flex-wrap: wrap; }
@media (max-width: 1100px) {
  .fk__main { flex-direction: column; }
  .fk__side { width: 100%; }
}
@media (max-width: 720px) {
  .fk__ringkas { flex-direction: column; }
}
</style>
