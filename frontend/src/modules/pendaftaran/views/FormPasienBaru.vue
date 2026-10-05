<script setup>
/** PDR-03 · Pendaftaran — Form Pasien Baru */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, FormField } from '@/components/ui'
import StepTabs from './parts-a/StepTabs.vue'
import {
  langkahPasienBaru,
  pasienBaruAwal,
  rmBaru,
  opsiJenisKelamin,
  opsiAgama,
  opsiDomisili,
  opsiPenjamin,
} from '../data-a'

const router = useRouter()
const langkah = ref(2)
const form = reactive({ ...pasienBaruAwal })
const setuju = ref(true)
const nikTerverifikasi = ref(true)
const dicoba = ref(false)

// Validasi sederhana isian wajib
const errors = computed(() => {
  const e = {}
  if (!/^[0-9X]{12,16}$/.test(form.nik.trim())) e.nik = 'NIK 16 digit wajib diisi'
  if (!form.nama.trim()) e.nama = 'Nama wajib diisi'
  if (!form.tanggalLahir.trim()) e.tanggalLahir = 'Tanggal lahir wajib diisi'
  if (!/^[0-9X+]{9,15}$/.test(form.telepon.trim())) e.telepon = 'Nomor telepon tidak valid'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Format email tidak valid'
  if (!form.penjamin) e.penjamin = 'Pilih penjamin'
  return e
})
const err = (k) => (dicoba.value ? errors.value[k] : '')

function verifikasiNik() {
  dicoba.value = true
  nikTerverifikasi.value = !errors.value.nik
  if (nikTerverifikasi.value) langkah.value = 2
}

function simpan() {
  dicoba.value = true
  if (Object.keys(errors.value).length || !setuju.value) return
  router.push({ path: '/pendaftaran/form-kunjungan', query: { rm: rmBaru } })
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <StepTabs v-model="langkah" :tabs="langkahPasienBaru" />

    <UiAlert
      v-if="dicoba && (Object.keys(errors).length || !setuju)"
      tone="danger"
      title="Data belum lengkap"
      :text="!setuju ? 'Persetujuan penggunaan data pasien wajib dicentang.' : 'Periksa kembali isian bertanda merah.'"
    />

    <div class="row pb__main">
      <UiCard class="grow" title="Identitas pasien baru">
        <!-- Langkah 1 · Verifikasi NIK -->
        <template v-if="langkah === 1">
          <FormField label="NIK" required :error="err('nik')" hint="Scan KTP-el atau ketik NIK lalu verifikasi ke Dukcapil">
            <input v-model="form.nik" class="input" inputmode="numeric" />
          </FormField>
          <div><UiButton variant="primary" @click="verifikasiNik">Verifikasi NIK</UiButton></div>
        </template>

        <UiAlert
          v-if="nikTerverifikasi && langkah !== 1"
          tone="success"
          title="✓ NIK terverifikasi"
          text="Data Dukcapil terisi otomatis · Patient IHS sedang disiapkan"
        />

        <!-- Langkah 2 · Demografi & kontak -->
        <div v-if="langkah === 2" class="grid-2">
          <FormField label="NIK" required :error="err('nik')">
            <input v-model="form.nik" class="input" inputmode="numeric" />
            <span v-if="!err('nik')" class="pb__ok">✓ Tidak ada duplikasi RM</span>
          </FormField>
          <FormField label="Nama" required :error="err('nama')">
            <input v-model="form.nama" class="input" />
          </FormField>
          <FormField label="Tanggal lahir" required :error="err('tanggalLahir')">
            <input v-model="form.tanggalLahir" class="input" />
          </FormField>
          <FormField label="Jenis kelamin">
            <select v-model="form.jenisKelamin" class="select">
              <option v-for="o in opsiJenisKelamin" :key="o">{{ o }}</option>
            </select>
          </FormField>
          <FormField label="Agama">
            <select v-model="form.agama" class="select">
              <option v-for="o in opsiAgama" :key="o">{{ o }}</option>
            </select>
          </FormField>
          <FormField label="Alamat KTP">
            <input v-model="form.alamat" class="input" />
          </FormField>
          <FormField label="Domisili">
            <select v-model="form.domisili" class="select">
              <option v-for="o in opsiDomisili" :key="o">{{ o }}</option>
            </select>
          </FormField>
          <FormField label="Nomor telepon" required :error="err('telepon')">
            <input v-model="form.telepon" class="input" inputmode="tel" />
          </FormField>
          <FormField label="Email" required :error="err('email')">
            <input v-model="form.email" class="input" type="email" />
          </FormField>
          <FormField label="Penjamin" required :error="err('penjamin')">
            <select v-model="form.penjamin" class="select">
              <option v-for="o in opsiPenjamin" :key="o">{{ o }}</option>
            </select>
          </FormField>
        </div>

        <!-- Langkah 3 · Penjamin -->
        <div v-if="langkah === 3" class="grid-2">
          <FormField label="Penjamin" required :error="err('penjamin')">
            <select v-model="form.penjamin" class="select">
              <option v-for="o in opsiPenjamin" :key="o">{{ o }}</option>
            </select>
          </FormField>
          <FormField v-if="form.penjamin.startsWith('BPJS')" label="Nomor kartu BPJS" hint="Eligibilitas dicek di Panel BPJS">
            <input v-model="form.noKartu" class="input" />
          </FormField>
          <FormField label="Kontak darurat">
            <input v-model="form.kontakDarurat" class="input" />
          </FormField>
          <FormField label="Hubungan">
            <input v-model="form.hubungan" class="input" />
          </FormField>
        </div>

        <!-- Langkah 4 · Kunjungan -->
        <UiAlert
          v-if="langkah === 4"
          tone="info"
          title="Lanjut ke form kunjungan"
          text="Simpan data pasien, lalu pilih poli, dokter, dan jadwal pada Form Kunjungan."
        />
      </UiCard>

      <UiCard class="pb__side" title="Persetujuan & identitas">
        <p>RM baru: {{ rmBaru }} NIK: {{ form.nik }}</p>
        <div><UiBadge tone="warning">IHS · Antrian</UiBadge></div>
        <UiAlert tone="info" title="Data digunakan untuk pelayanan">
          <label class="check pb__consent">
            <input v-model="setuju" type="checkbox" />
            <span>Pasien telah menyetujui penggunaan data sesuai kebijakan privasi.</span>
          </label>
        </UiAlert>
        <p class="t-sm">Kontak darurat: {{ form.kontakDarurat }} Hubungan: {{ form.hubungan }}</p>
      </UiCard>
    </div>

    <div class="row-between pb__actions">
      <p class="t-xs t-muted">Perubahan tercatat dalam jejak audit</p>
      <div class="row gap-8">
        <UiButton to="/pendaftaran/worklist-pendaftaran">Batal</UiButton>
        <UiButton variant="primary" @click="simpan">Simpan &amp; Lanjut Kunjungan</UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pb__main { width: 100%; }
.pb__side { width: 300px; flex-shrink: 0; }
.pb__ok { font-size: 11px; color: var(--c-success); }
.pb__consent { align-items: flex-start; color: inherit; }
.pb__consent input { margin-top: 2px; }
.pb__actions { width: 100%; flex-wrap: wrap; }
@media (max-width: 1100px) {
  .pb__main { flex-direction: column; }
  .pb__side { width: 100%; }
}
@media (max-width: 720px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
