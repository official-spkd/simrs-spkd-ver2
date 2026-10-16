<script setup lang="ts">
// KL-02 Workspace Pasien (tab: KL-03 Vital, KL-04 SOAP, KL-05 Resep & Tindakan, KL-08 Riwayat, Lampiran)
const route = useRoute()
const router = useRouter()
const { db, visit, patient, poli, doctor, latestVitals, getSoap, startExam, billItems } = useDb()
const { isDokter } = useDokterQueue()
const klinis = useKlinis()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const soap = computed(() => (v.value ? getSoap(id.value) : null))
onMounted(() => { try { localStorage.setItem(KL_AKTIF_KEY, id.value) } catch {} })

// Akun dokter: kunjungan, vital, SOAP, dan lampiran selalu dimuat dari server saat workspace dibuka.
const memuat = ref(isDokter.value)
const muatErr = ref('')
const muat = async () => {
  if (!isDokter.value) return
  memuat.value = true
  muatErr.value = ''
  try { await klinis.muat(id.value) } catch (e: any) { muatErr.value = e.message } finally { memuat.value = false }
}
onMounted(muat)
watch(id, muat)

const TABS = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'vital', label: 'Vital & Pengkajian' },
  { key: 'soap', label: 'SOAP' },
  { key: 'order', label: 'Resep & Tindakan' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'lampiran', label: 'Lampiran' },
]
const HEAD: Record<string, { code: string; title: string; sub: string }> = {
  ringkasan: { code: 'KL-02', title: 'Workspace Pasien', sub: 'Ringkasan episode klinis · Data tersimpan di server SIMRS sebelum dikirim ke Satu Sehat' },
  vital: { code: 'KL-03', title: 'Vital Sign & Pengkajian Awal', sub: 'Pencatatan berversi oleh satu akun bersama Dokter / Perawat' },
  soap: { code: 'KL-04', title: 'Editor SOAP + Lampiran', sub: 'EMR rawat jalan · Diagnosis ICD-10 utama wajib sebelum tanda tangan' },
  order: { code: 'KL-05', title: 'Resep & Tindakan', sub: 'Item dicatat dalam Plan dan diteruskan sebagai tagihan sesuai tarif penjamin.' },
  riwayat: { code: 'KL-08', title: 'Riwayat Kunjungan', sub: 'Rekam medis longitudinal · Riwayat final hanya dapat dibaca' },
  lampiran: { code: 'KL-04', title: 'Lampiran Medis', sub: 'Berkas pendukung SOAP kunjungan ini' },
}
const tab = ref<string>(TABS.some((t) => t.key === route.query.tab) ? String(route.query.tab) : 'ringkasan')
watch(tab, (k) => { if (route.query.tab !== k) router.replace({ query: { ...route.query, tab: k } }) })
watch(() => route.query.tab, (k) => { const n = k ? String(k) : 'ringkasan'; if (TABS.some((t) => t.key === n) && n !== tab.value) tab.value = n })
const head = computed(() => HEAD[tab.value])

const editable = computed(() => v.value?.status === 'dilayani')
// pengkajian awal (KL-03) boleh diisi sebelum "Mulai periksa", selama kunjungan belum ditutup/dibatalkan dan SOAP belum dikunci
const vitalEditable = computed(() => (v.value?.status === 'terdaftar' || v.value?.status === 'dilayani') && !soap.value?.signed)
const readonlyLabel = computed(() => (v.value?.status === 'selesai' || v.value?.status === 'lunas' ? 'Kunjungan sudah selesai — mode baca.' : v.value?.status === 'dibatalkan' ? 'Kunjungan dibatalkan.' : ''))
const vt = computed(() => latestVitals(id.value))
const hasVital = computed(() => !!vt.value)
const hasSign = computed(() => !!soap.value?.signed)
const hasDiag = computed(() => !!soap.value?.diagUtama)
const siap = computed(() => hasVital.value && hasSign.value && hasDiag.value)
const items = computed(() => (v.value ? billItems(id.value) : []))
const keluhan = computed(() => soap.value?.s || vt.value?.keluhan || v.value?.keluhan || '-')
const tdAbn = computed(() => {
  const m = String(vt.value?.td || '').match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/)
  return !!m && (+m[1] >= 140 || +m[2] >= 90 || +m[1] <= 90 || +m[2] <= 60)
})
const angka = (n: any) => (n === null || n === undefined || n === '' ? '-' : String(n).replace('.', ','))

// tindak lanjut: tanggal kontrol dari penutupan kunjungan, atau rencana di SOAP
const kontrol = computed(() => {
  if (v.value?.tglKontrol) return 'Kontrol · ' + fmtTglPanjang(v.value.tglKontrol).replace(/^\w+, /, '')
  const t = soap.value?.tindakLanjut
  return t === 'kontrol' ? 'Kontrol · tanggal belum diisi di SOAP' : t === 'rawat inap' ? 'Rujuk rawat inap (dicatat)' : t === 'ICU' ? 'Rujuk ICU (dicatat)' : 'Pulang'
})
const reservasiPasien = computed(() => db.reservations.filter((r: any) => r.patientId === v.value?.patientId).sort((a: any, b: any) => (a.tanggal < b.tanggal ? 1 : -1)))
const showRsv = ref(false)

const showClose = ref(false)
const mulai = async () => {
  try {
    await (isDokter.value ? klinis.mulaiPeriksa(id.value) : startExam(id.value))
    toast.ok('Pemeriksaan dimulai')
  } catch (e: any) { toast.err(e.message) }
}
const onClosed = () => { navigateTo('/klinis') }
const goto = (k: string) => (tab.value = k)
const lihat = async (l: any) => {
  if (l.id) { try { await klinis.bukaLampiran(l.id) } catch (e: any) { toast.err(e.message) } return }
  if (urlLampiran(l)) window.open(urlLampiran(l), '_blank')
  else toast.warn('Pratinjau hanya tersedia pada sesi saat berkas diunggah (MVP menyimpan metadata).')
}
</script>

<template>
  <div v-if="memuat && !v" class="panel"><p class="muted">Memuat kunjungan…</p></div>
  <div v-else-if="v && pt">
    <p v-if="muatErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat data terbaru dari server: {{ muatErr }}</p>
    <PageHead :code="head.code" role="Dokter / Perawat" :title="head.title" :subtitle="head.sub" />

    <PatientBanner :patient="pt" :visit="v" />

    <div v-if="v.status === 'terdaftar'" class="alert warn" style="margin-bottom: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap">
      <span>Kunjungan masih berstatus <b>terdaftar</b>. Vital &amp; pengkajian awal sudah bisa diisi; SOAP, resep, dan tindakan terbuka setelah <b>Mulai periksa</b>.</span>
      <button class="btn btn-primary btn-sm" @click="mulai">Mulai periksa</button>
    </div>
    <div v-else-if="readonlyLabel" class="alert info" style="margin-bottom: 14px"><span>{{ readonlyLabel }}</span></div>

    <AppTabs v-model="tab" :tabs="TABS" />

    <!-- KL-02 ringkasan episode -->
    <div v-if="tab === 'ringkasan'" class="kl-col">
      <div class="grid g4">
        <div class="kl-kpi"><small>Tekanan darah</small><b :style="tdAbn ? 'color:var(--err)' : ''">{{ vt?.td || '-' }}</b><span>mmHg · {{ vt ? 'Diukur ' + fmtJam(vt.waktu || vt.at) : 'Belum diukur' }}</span></div>
        <div class="kl-kpi"><small>Nadi / RR</small><b>{{ vt ? `${vt.nadi} / ${vt.rr}` : '-' }}</b><span>per menit</span></div>
        <div class="kl-kpi"><small>Suhu / SpO₂</small><b>{{ vt ? `${angka(vt.suhu)} / ${vt.spo2}%` : '-' }}</b><span>°C · Udara ruangan</span></div>
        <div class="kl-kpi"><small>BMI</small><b>{{ angka(vt?.bmi) }}</b><span>{{ vt?.bb && vt?.tb ? `BB ${angka(vt.bb)} kg · TB ${vt.tb} cm` : 'BB / TB belum diisi' }}</span></div>
      </div>

      <div class="kl-cols">
        <div class="panel">
          <h2>Ringkasan klinis</h2>
          <h3>Keluhan utama</h3>
          <p>{{ keluhan }}</p>
          <h3>Diagnosis utama · ICD-10</h3>
          <div><span v-if="soap?.diagUtama" class="badge b-navy">{{ soap.diagUtama.kode }} · {{ soap.diagUtama.nama }}</span><span v-else class="muted" style="font-size: 13px">Belum ditetapkan</span></div>
          <h3>Rencana pelayanan</h3>
          <p>{{ soap?.p || '-' }}</p>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Item Plan / tagihan</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="it in items" :key="it.id"><td data-label="Item">{{ it.nama }}</td><td data-label="Qty">{{ it.qty }}</td><td data-label="Subtotal" style="color: var(--teal-d)">{{ fmtRp(it.subtotal) }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="kl-actions">
            <button class="btn" @click="goto('soap')">Buka SOAP</button>
            <button class="btn" @click="goto('order')">Resep &amp; tindakan</button>
            <button class="btn" @click="goto('lampiran')">Lihat lampiran</button>
          </div>
        </div>

        <div class="kl-col">
          <div class="panel">
            <h2>Kelengkapan kunjungan</h2>
            <div class="kl-check" :class="hasVital ? 'ok' : 'no'">{{ hasVital ? '☑' : '☐' }} Vital &amp; pengkajian lengkap</div>
            <div class="kl-check" :class="hasSign ? 'ok' : 'no'">{{ hasSign ? '☑' : '☐' }} SOAP ditandatangani</div>
            <div class="kl-check" :class="hasDiag ? 'ok' : 'no'">{{ hasDiag ? '☑' : '☐' }} Diagnosis utama ICD-10</div>
            <div>
              <span v-if="v.status === 'selesai' || v.status === 'lunas'" class="badge b-ok">Pelayanan selesai</span>
              <span v-else-if="siap" class="badge b-ok">Siap menutup pelayanan</span>
              <span v-else class="badge b-warn">Belum lengkap</span>
            </div>
            <p v-if="soap?.signed">SOAP final · {{ doctor(v.doctorId)?.nama }} · {{ fmtJam(soap.signedAt) }}</p>
            <div v-if="v.status === 'dilayani'">
              <button class="btn btn-primary" :disabled="!siap" @click="showClose = true">Tutup pelayanan kunjungan</button>
            </div>
            <div v-else-if="v.status === 'terdaftar'"><button class="btn btn-primary" @click="mulai">Mulai periksa</button></div>
            <div class="guide">Setelah ditutup, kunjungan menjadi selesai dan tagihan dapat difinalisasi kasir.</div>
          </div>
          <div class="panel">
            <h2>Tindak lanjut</h2>
            <h3>{{ kontrol }}</h3>
            <p>{{ poli(v.poliId)?.nama }} · {{ doctor(v.doctorId)?.nama }}</p>
            <p>Tanggal kontrol hanya membuat reservasi. Tidak menerbitkan SKDP otomatis.</p>
            <div><button class="btn" @click="showRsv = true">Buka reservasi kontrol</button></div>
          </div>
        </div>
      </div>
    </div>

    <KlVital v-else-if="tab === 'vital'" :visit-id="id" :editable="vitalEditable" @next="goto('soap')" @back="goto('ringkasan')" />
    <KlSoap v-else-if="tab === 'soap'" :visit-id="id" :editable="editable" @goto="goto" />
    <KlOrders v-else-if="tab === 'order'" :visit-id="id" :editable="editable" />
    <KlRiwayat v-else-if="tab === 'riwayat'" :visit-id="id" @back="goto('ringkasan')" />
    <div v-else-if="tab === 'lampiran'" class="panel">
      <h2>Lampiran medis</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>File</th><th>Ukuran</th><th>Status</th><th>Dicatat</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="!soap?.lampiran?.length"><td class="empty" colspan="5">Belum ada lampiran. Unggah dari tab SOAP.</td></tr>
            <tr v-for="(l, i) in soap?.lampiran || []" :key="i">
              <td data-label="File">{{ l.nama }}</td>
              <td data-label="Ukuran">{{ (l.ukuran / 1024).toFixed(0) }} KB</td>
              <td data-label="Status">{{ l.id ? 'Tersimpan di server' : 'Tersimpan lokal' }}</td>
              <td data-label="Dicatat">{{ fmtWaktu(l.at) }}</td>
              <td data-label="Aksi"><button class="btn btn-sm btn-ghost" @click="lihat(l)">Lihat</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <KlTutup v-model="showClose" :visit-id="id" @closed="onClosed" />

    <AppModal v-model="showRsv" title="Reservasi kontrol pasien" size="lg">
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kode</th><th>Tanggal</th><th>Poli / dokter</th><th>Jam</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-if="!reservasiPasien.length"><td class="empty" colspan="5">Belum ada reservasi. Reservasi kontrol dibuat otomatis saat menutup kunjungan dengan cara pulang "Kontrol ulang".</td></tr>
            <tr v-for="r in reservasiPasien" :key="r.id">
              <td data-label="Kode">{{ r.kode }}</td><td data-label="Tanggal">{{ fmtTgl(r.tanggal) }}</td>
              <td data-label="Poli / dokter">{{ poli(r.poliId)?.nama }} · {{ doctor(r.doctorId)?.nama }}</td><td data-label="Jam">{{ r.jam }}</td>
              <td data-label="Status"><StatusBadge :value="r.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Perubahan reservasi dilakukan oleh Front Office (FO-08).</p>
    </AppModal>
  </div>
  <div v-else class="card">
    <h2>Kunjungan tidak ditemukan</h2>
    <p v-if="muatErr" class="muted">{{ muatErr }}</p>
    <NuxtLink to="/klinis" class="btn">Kembali ke worklist</NuxtLink>
  </div>
</template>
