<script setup>
/** MD-03 · Master data — Detail Pasien. Query ?id=<RM>; default pasien pertama. */
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserRound } from 'lucide-vue-next'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, FormField, DataTable } from '@/components/ui'
import SegTabs from './parts-b/SegTabs.vue'
import AksiHalaman from './parts-b/AksiHalaman.vue'
import CekList from './parts-a/CekList.vue'
import { pasien, tabPasien, kelengkapanPasien, riwayatKunjungan, dokumenPasien } from '../data-a'

const route = useRoute()
const router = useRouter()

// Proxy reaktif atas data mock agar perubahan tersimpan selama sesi.
const semua = reactive(pasien)
const p = computed(() => semua.find((x) => x.id === route.query.id) ?? semua[0])
const tab = ref(tabPasien[0])
const kelengkapan = ref(kelengkapanPasien.map((k) => ({ ...k })))

// Isian formulir — salinan lokal agar "Batal" bisa mengembalikan nilai awal.
const fieldKeys = ['nik', 'nama', 'tglLahir', 'jk', 'agama', 'kawin', 'alamatKtp', 'alamatDomisili', 'telp', 'email', 'penjamin', 'kontakDarurat', 'alergi', 'reaksiAlergi']
const wajib = { nik: 'NIK', nama: 'Nama lengkap', tglLahir: 'Tanggal lahir', jk: 'Jenis kelamin', telp: 'Nomor telepon', email: 'Email' }
const form = reactive({})
const errors = reactive({})
const pesan = ref(null)

function isiForm() {
  fieldKeys.forEach((k) => (form[k] = p.value[k] ?? ''))
  Object.keys(errors).forEach((k) => delete errors[k])
}
watch(p, isiForm, { immediate: true })

function validasi() {
  Object.keys(errors).forEach((k) => delete errors[k])
  Object.entries(wajib).forEach(([k, label]) => {
    if (!String(form[k] ?? '').trim()) errors[k] = `${label} wajib diisi`
  })
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Format email tidak valid'
  if (Object.keys(errors).length) {
    tab.value = 'Demografi'
    pesan.value = { tone: 'danger', title: 'Data belum lengkap', text: 'Lengkapi isian bertanda * sebelum menyimpan.' }
    return false
  }
  return true
}

function batal() {
  isiForm()
  pesan.value = null
}
function simpan() {
  if (!validasi()) return
  Object.assign(p.value, form)
  pesan.value = { tone: 'success', title: 'Data pasien tersimpan', text: `${form.nama} · RM ${p.value.rm} · Patient dikirim ulang ke Satu Sehat.` }
}
function simpanDanKunjungan() {
  if (!validasi()) return
  Object.assign(p.value, form)
  router.push({ path: '/pendaftaran/form-kunjungan', query: { rm: p.value.rm } })
}

const penjaminRingkas = computed(() =>
  p.value.penjamin.startsWith('BPJS') ? `BPJS aktif · ${p.value.penjamin.replace('BPJS ', '')}` : p.value.penjamin,
)
const adaAlergi = computed(() => p.value.alergi && p.value.alergi !== 'Tidak ada')

const opsiAgama = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']
const opsiKawin = ['Belum menikah', 'Menikah', 'Cerai hidup', 'Cerai mati']
const opsiPenjamin = ['BPJS Kelas 1', 'BPJS Kelas 2', 'BPJS Kelas 3', 'Umum', 'Asuransi swasta']

const kolomKunjungan = [
  { key: 'tanggal', label: 'Tanggal', strong: true },
  { key: 'layanan', label: 'Layanan' },
  { key: 'dokter', label: 'Dokter' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terkirim' ? 'success' : null) },
]
const kolomDokumen = [
  { key: 'nama', label: 'Dokumen', strong: true },
  { key: 'jenis', label: 'Jenis' },
  { key: 'diunggah', label: 'Diunggah' },
  { key: 'status', label: 'Status', tone: (r) => (r.status === 'Terverifikasi' ? 'success' : 'warning') },
]
</script>

<template>
  <div class="page">
    <PageHeader />

    <!-- Banner pasien -->
    <section class="banner">
      <div class="banner__top">
        <div class="banner__avatar"><UserRound aria-hidden="true" /></div>
        <div class="banner__id">
          <p class="banner__nama">{{ p.nama }}</p>
          <p class="t-sm banner__sub">{{ p.jk }} · {{ p.umur }} tahun · RM {{ p.rm }} · {{ p.penjamin }}</p>
        </div>
        <UiBadge tone="primary">{{ p.antrean }}</UiBadge>
      </div>
      <p class="t-sm banner__sub">
        NIK {{ p.nik }} · {{ p.ihsId ? `IHS ${p.ihsId}` : p.ihs }} · ✓ Dukcapil
      </p>
      <div class="banner__bottom">
        <UiBadge v-if="adaAlergi" tone="danger">ALERGI: {{ p.alergi.toUpperCase() }}</UiBadge>
        <UiBadge v-else>Tidak ada alergi</UiBadge>
        <p class="t-xs banner__sub grow">{{ p.kunjungan }}</p>
      </div>
    </section>

    <SegTabs v-model="tab" :tabs="tabPasien" />

    <UiAlert v-if="pesan" :tone="pesan.tone" :title="pesan.title" :text="pesan.text" />

    <div class="row md-body">
      <!-- Konten tab -->
      <UiCard v-if="tab === 'Demografi'" class="grow" title="Identitas dan demografi">
        <UiAlert
          tone="success"
          title="✓ Identitas terverifikasi Dukcapil"
          text="Nama, tanggal lahir, agama, dan alamat terisi otomatis saat NIK selesai diinput."
        />
        <div class="grid-2">
          <FormField label="NIK" required :error="errors.nik">
            <input v-model="form.nik" class="input" :class="{ 'input--error': errors.nik }" />
            <span v-if="!errors.nik" class="t-xs t-success">✓ Dukcapil · 09:10 WIB</span>
          </FormField>
          <FormField label="Nama lengkap" required :error="errors.nama">
            <input v-model="form.nama" class="input" :class="{ 'input--error': errors.nama }" />
          </FormField>
          <FormField label="Tanggal lahir" required :error="errors.tglLahir">
            <input v-model="form.tglLahir" class="input" :class="{ 'input--error': errors.tglLahir }" />
          </FormField>
          <FormField label="Jenis kelamin" required :error="errors.jk">
            <select v-model="form.jk" class="select">
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </FormField>
          <FormField label="Agama">
            <select v-model="form.agama" class="select">
              <option v-for="a in opsiAgama" :key="a">{{ a }}</option>
            </select>
          </FormField>
          <FormField label="Status perkawinan">
            <select v-model="form.kawin" class="select">
              <option v-for="k in opsiKawin" :key="k">{{ k }}</option>
            </select>
          </FormField>
          <FormField label="Alamat KTP">
            <input v-model="form.alamatKtp" class="input" />
          </FormField>
          <FormField label="Alamat domisili">
            <input v-model="form.alamatDomisili" class="input" />
          </FormField>
          <FormField label="Nomor telepon" required :error="errors.telp">
            <input v-model="form.telp" class="input" :class="{ 'input--error': errors.telp }" />
          </FormField>
          <FormField label="Email" required :error="errors.email">
            <input v-model="form.email" type="email" class="input" :class="{ 'input--error': errors.email }" />
          </FormField>
        </div>
      </UiCard>

      <UiCard v-else-if="tab === 'Kontak'" class="grow" title="Kontak">
        <div class="grid-2">
          <FormField label="Nomor telepon" required>
            <input v-model="form.telp" class="input" />
          </FormField>
          <FormField label="Email" required>
            <input v-model="form.email" type="email" class="input" />
          </FormField>
          <FormField label="Alamat domisili">
            <input v-model="form.alamatDomisili" class="input" />
          </FormField>
          <FormField label="Kontak darurat">
            <input v-model="form.kontakDarurat" class="input" />
          </FormField>
        </div>
      </UiCard>

      <UiCard v-else-if="tab === 'Penjamin'" class="grow" title="Penjamin">
        <div class="grid-2">
          <FormField label="Penjamin utama">
            <select v-model="form.penjamin" class="select">
              <option v-for="j in opsiPenjamin" :key="j">{{ j }}</option>
            </select>
          </FormField>
          <FormField label="Status verifikasi">
            <input
              class="input"
              readonly
              :value="form.penjamin.startsWith('BPJS') ? 'Aktif · terverifikasi 09:10 WIB' : 'Tidak memerlukan verifikasi BPJS'"
            />
          </FormField>
        </div>
      </UiCard>

      <div v-else-if="tab === 'Alergi-Riwayat'" class="grow stack">
        <UiCard title="Alergi">
          <div class="grid-2">
            <FormField label="Alergen">
              <input v-model="form.alergi" class="input" />
            </FormField>
            <FormField label="Reaksi">
              <input v-model="form.reaksiAlergi" class="input" placeholder="Mis. ruam, sesak" />
            </FormField>
          </div>
        </UiCard>
        <DataTable
          title="Riwayat kunjungan"
          :columns="kolomKunjungan"
          :rows="riwayatKunjungan"
          :filterable="false"
          export-name="riwayat-kunjungan"
        />
      </div>

      <DataTable
        v-else
        class="grow"
        title="Dokumen"
        :columns="kolomDokumen"
        :rows="dokumenPasien"
        :filterable="false"
        export-name="dokumen-pasien"
      />

      <!-- Ringkasan profil -->
      <UiCard class="md-ringkas" title="Ringkasan profil">
        <div><UiBadge :tone="p.ihsId ? 'success' : 'warning'">{{ p.patientStatus }}</UiBadge></div>
        <p class="t-body">{{ penjaminRingkas }}<br />Kontak darurat: {{ p.kontakDarurat }}</p>
        <UiAlert v-if="adaAlergi" tone="danger" :title="`Alergi ${p.alergi.toUpperCase()}`" :text="p.reaksiAlergi" />
        <CekList :items="kelengkapan" />
      </UiCard>
    </div>

    <AksiHalaman>
      <UiButton @click="batal">Batal</UiButton>
      <UiButton @click="simpan">Simpan</UiButton>
      <UiButton variant="primary" @click="simpanDanKunjungan">Simpan &amp; Buat Kunjungan</UiButton>
    </AksiHalaman>
  </div>
</template>

<style scoped>
/* Banner pasien — biru tua desain (#10488f) belum memiliki token. */
.banner {
  background: #10488f;
  color: #fff;
  border-radius: var(--r-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.banner__top { display: flex; gap: 12px; align-items: flex-start; }
.banner__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.banner__avatar svg { width: 20px; height: 20px; }
.banner__id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.banner__nama { font-size: 20px; font-weight: 600; }
.banner__sub { color: #d8e9ff; }
.banner__bottom { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.md-ringkas { width: 300px; flex-shrink: 0; }
@media (max-width: 1100px) {
  .md-body { flex-direction: column; }
  .md-ringkas { width: 100%; }
}
@media (max-width: 700px) {
  .grid-2 { grid-template-columns: minmax(0, 1fr); }
}
</style>
