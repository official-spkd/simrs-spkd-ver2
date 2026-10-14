<script setup lang="ts">
// KL-02 Workspace Pasien
const route = useRoute()
const router = useRouter()
const { visit, patient, poli, doctor, latestVitals, getSoap, startExam } = useDb()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const soap = computed(() => (v.value ? getSoap(id.value) : null))

const TABS = [
  { key: 'vital', label: 'Vital & Pengkajian' },
  { key: 'soap', label: 'SOAP' },
  { key: 'order', label: 'Resep & Tindakan' },
  { key: 'surat', label: 'Surat' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'lampiran', label: 'Lampiran' },
]
const tab = ref<string>(TABS.some((t) => t.key === route.query.tab) ? String(route.query.tab) : 'vital')
watch(tab, (k) => { if (route.query.tab !== k) router.replace({ query: { ...route.query, tab: k } }) })
watch(() => route.query.tab, (k) => { if (k && TABS.some((t) => t.key === k) && k !== tab.value) tab.value = String(k) })

const editable = computed(() => v.value?.status === 'dilayani')
const readonlyLabel = computed(() => (v.value?.status === 'selesai' || v.value?.status === 'lunas' ? 'Kunjungan sudah selesai — mode baca.' : v.value?.status === 'dibatalkan' ? 'Kunjungan dibatalkan.' : ''))
const hasVital = computed(() => !!latestVitals(id.value))
const hasSign = computed(() => !!soap.value?.signed)
const hasDiag = computed(() => !!soap.value?.diagUtama)

const showClose = ref(false)
const mulai = () => { toast.attempt(() => startExam(id.value), 'Pemeriksaan dimulai') }
const onClosed = () => { navigateTo('/klinis') }
const goto = (k: string) => (tab.value = k)
</script>

<template>
  <div v-if="v && pt">
    <PageHead code="KL-02" role="Dokter / Perawat" title="Workspace Pasien" :crumbs="['Klinis', 'Worklist poli', pt.nama]">
      <template #actions>
        <NuxtLink to="/klinis" class="btn">Kembali ke worklist</NuxtLink>
        <button v-if="v.status === 'terdaftar'" class="btn btn-primary" @click="mulai">Mulai periksa</button>
        <button v-if="v.status === 'dilayani'" class="btn btn-primary" @click="showClose = true">Tutup kunjungan</button>
      </template>
    </PageHead>

    <PatientBanner :patient="pt" :visit="v">
      <div class="f"><small>Poli / Dokter</small><b>{{ poli(v.poliId).nama }} · {{ doctor(v.doctorId).nama }}</b></div>
      <div class="f"><small>Antrean</small><b>{{ v.antreanPoli.nomor }}</b> <StatusBadge :value="v.status" /></div>
    </PatientBanner>

    <div class="row" style="margin-bottom:14px">
      <span class="badge" :class="hasVital ? 'b-ok' : 'b-warn'">{{ hasVital ? '✓' : '○' }} Vital</span>
      <span class="badge" :class="hasSign ? 'b-ok' : 'b-warn'">{{ hasSign ? '✓' : '○' }} SOAP ditandatangani</span>
      <span class="badge" :class="hasDiag ? 'b-ok' : 'b-warn'">{{ hasDiag ? '✓' : '○' }} Diagnosis utama</span>
    </div>

    <div v-if="v.status === 'terdaftar'" class="alert warn" style="margin-bottom:14px">
      <span>Kunjungan masih berstatus <b>terdaftar</b>. Klik <b>Mulai periksa</b> agar data klinis dapat diisi.</span>
    </div>
    <div v-else-if="readonlyLabel" class="alert info" style="margin-bottom:14px"><span>{{ readonlyLabel }}</span></div>

    <AppTabs v-model="tab" :tabs="TABS" />

    <KlVital v-if="tab === 'vital'" :visit-id="id" :editable="editable" @next="goto('soap')" />
    <KlSoap v-else-if="tab === 'soap'" :visit-id="id" :editable="editable" @goto="goto" />
    <KlOrders v-else-if="tab === 'order'" :visit-id="id" :editable="editable" />
    <div v-else-if="tab === 'surat'" class="stack">
      <div class="alert info"><span>Penerbitan surat (SKDP, rujukan, kontrol) otomatis menyusul (KL-07 ditunda). Surat rujukan/kontrol dicatat sebagai dokumen administratif saat pendaftaran.</span></div>
      <div class="card">
        <h2>Dokumen administratif kunjungan</h2>
        <dl class="kv">
          <dt>No. rujukan</dt><dd>{{ v.sep?.noRujukan || '-' }}</dd>
          <dt>No. surat kontrol</dt><dd>{{ v.sep?.noKontrol || '-' }}</dd>
          <dt>No. SEP</dt><dd>{{ v.sep?.noSep || '-' }}</dd>
        </dl>
        <div style="margin-top:12px">
          <div v-if="!(v.dokumen || []).length" class="muted">Belum ada dokumen administratif tercatat.</div>
          <ul v-else style="margin:0;padding-left:18px">
            <li v-for="(d, i) in v.dokumen" :key="i">{{ d.nama || d.jenis || d }}<span v-if="d.jenis && d.nama" class="muted small"> · {{ d.jenis }}</span></li>
          </ul>
        </div>
      </div>
    </div>
    <KlRiwayat v-else-if="tab === 'riwayat'" :visit-id="id" />
    <div v-else-if="tab === 'lampiran'" class="card">
      <h2>Lampiran SOAP</h2>
      <div v-if="!soap?.lampiran?.length" class="muted">Belum ada lampiran. Unggah dari tab SOAP.</div>
      <div v-else class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Nama berkas</th><th>Tipe</th><th>Ukuran</th><th>Dicatat</th></tr></thead>
          <tbody>
            <tr v-for="(l, i) in soap.lampiran" :key="i">
              <td data-label="Nama berkas"><a v-if="l.url" :href="l.url" target="_blank">{{ l.nama }}</a><span v-else>{{ l.nama }}</span></td>
              <td data-label="Tipe">{{ l.tipe }}</td>
              <td data-label="Ukuran">{{ (l.ukuran / 1024).toFixed(0) }} KB</td>
              <td data-label="Dicatat">{{ fmtWaktu(l.at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <KlTutup v-model="showClose" :visit-id="id" @closed="onClosed" />
  </div>
  <div v-else class="card">
    <h2>Kunjungan tidak ditemukan</h2>
    <NuxtLink to="/klinis" class="btn">Kembali ke worklist</NuxtLink>
  </div>
</template>
