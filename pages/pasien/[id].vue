<script setup lang="ts">
// FO-04 Detail Pasien & Riwayat
const route = useRoute()
const { db, poli, doctor, updatePatient, doctorsOfPoli, sessionFor, createReservation } = useDb()
const { user } = useAuth()
const toast = useToast()
const pasien = usePatients()

const pt = computed(() => db.patients.find((p: any) => p.id === route.params.id))
const loading = ref(false)
const loadErr = ref('')
// ID UUID = pasien dari server; ID lain (mis. "p1") = data contoh lokal yang belum ada di server.
const load = async () => {
  const id = String(route.params.id)
  if (!isServerId(id)) return
  loading.value = true
  loadErr.value = ''
  try {
    const p = await pasien.get(id)
    loadRiwayat(p.nik)
  } catch (e: any) { loadErr.value = e.message } finally { loading.value = false }
}
onMounted(load)

// Riwayat kunjungan dari server. API belum bisa memfilter per patient_id, jadi dicari lewat NIK;
// tabel riwayat tetap menyaring berdasarkan patientId sehingga pasien lain yang kebetulan cocok tidak ikut tampil.
const visitSvc = useVisits()
const riwayatLoading = ref(false)
const riwayatErr = ref('')
const riwayat = ref<any[]>([])
const loadRiwayat = async (nik: string) => {
  riwayatLoading.value = true
  riwayatErr.value = ''
  try {
    const r = await visitSvc.listView({ search: nik, limit: 100 })
    riwayat.value = r.rows.filter((v: any) => v.patientId === route.params.id)
  } catch (e: any) { riwayatErr.value = e.message } finally { riwayatLoading.value = false }
}
const role = computed(() => user.value?.role)
const isFo = computed(() => role.value === 'fo')
const isKasir = computed(() => role.value === 'kasir')

const tab = ref(isKasir.value ? 'penjamin' : 'demografi')
const TABS = computed(() => {
  const all = [
    { key: 'demografi', label: 'Demografi' }, { key: 'kontak', label: 'Kontak' }, { key: 'penjamin', label: 'Penjamin' }, { key: 'pj', label: 'Penanggung jawab' },
    { key: 'riwayat', label: 'Riwayat' }, { key: 'dokumen', label: 'Dokumen' },
  ]
  return isKasir.value ? all.filter((t) => ['penjamin', 'riwayat', 'dokumen'].includes(t.key)) : all
})

type F = { k: string; l: string; opt?: string[]; type?: string; ro?: boolean; area?: boolean }
const FIELDS: Record<string, F[]> = {
  demografi: [
    { k: 'nik', l: 'NIK', ro: true }, { k: 'nama', l: 'Nama lengkap' }, { k: 'tglLahir', l: 'Tanggal lahir', type: 'date' },
    { k: 'jk', l: 'Jenis kelamin', opt: ['L', 'P'] }, { k: 'tempatLahir', l: 'Tempat lahir' },
    { k: 'agama', l: 'Agama', opt: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'] },
    { k: 'pendidikan', l: 'Pendidikan', opt: ['Tidak sekolah', 'SD', 'SMP', 'SMA', 'Diploma', 'Sarjana', 'Pascasarjana'] },
    { k: 'pekerjaan', l: 'Pekerjaan' }, { k: 'statusKawin', l: 'Status kawin', opt: ['Belum kawin', 'Kawin', 'Cerai hidup', 'Cerai mati'] },
    { k: 'golDarah', l: 'Golongan darah', opt: ['A', 'B', 'AB', 'O'] }, { k: 'alergi', l: 'Alergi' },
  ],
  kontak: [
    { k: 'hp', l: 'No. HP' }, { k: 'email', l: 'Email', type: 'email' }, { k: 'alamatKtp', l: 'Alamat KTP', area: true }, { k: 'alamatDomisili', l: 'Alamat domisili', area: true },
  ],
  penjamin: [{ k: 'penjamin', l: 'Penjamin default', opt: ['Umum', 'BPJS', 'Asuransi'] }, { k: 'noKartu', l: 'No. kartu BPJS' }, { k: 'asuransi', l: 'Nama asuransi' }, { k: 'noPolis', l: 'No. polis' }],
  pj: [{ k: 'pjNama', l: 'Nama' }, { k: 'pjHubungan', l: 'Hubungan' }, { k: 'pjHp', l: 'No. HP' }],
}
const fieldsOf = computed(() => FIELDS[tab.value] || [])

const editing = ref(false)
const ef = reactive<any>({})
// Kolom angka: huruf/simbol langsung dibuang saat diketik atau ditempel.
watch(() => ef.noKartu, (v) => { if (v == null) return; const c = onlyDigits(v, 13); if (c !== v) ef.noKartu = c })
watch(() => ef.hp, (v) => { if (v == null) return; const c = phoneChars(v); if (c !== v) ef.hp = c })
watch(() => ef.pjHp, (v) => { if (v == null) return; const c = phoneChars(v); if (c !== v) ef.pjHp = c })
const NUMERIC: Record<string, { mode: 'tel' | 'numeric'; max: number }> ={ hp: { mode: 'tel', max: 15 }, pjHp: { mode: 'tel', max: 15 }, noKartu: { mode: 'numeric', max: 13 } }
const err = ref('')
const startEdit = () => {
  if (!pt.value) return
  Object.keys(FIELDS).forEach((t) => FIELDS[t].forEach((x) => (ef[x.k] = pt.value[x.k] ?? '')))
  err.value = ''
  editing.value = true
}
const saving = ref(false)
const saveEdit = async () => {
  err.value = ''
  if (ef.nama.trim().length < 3) { err.value = 'Nama wajib diisi (minimal 3 karakter)'; return }
  if (!ef.tglLahir || !ef.jk || !ef.tempatLahir.trim()) { err.value = 'Tanggal lahir, jenis kelamin, dan tempat lahir wajib diisi'; return }
  if (!ef.hp.trim() || ef.alamatKtp.trim().length < 5) { err.value = 'No. HP dan alamat KTP (minimal 5 karakter) wajib diisi'; return }
  if (ef.alamatDomisili.trim() && ef.alamatDomisili.trim().length < 5) { err.value = 'Alamat domisili minimal 5 karakter'; return }
  if (ef.pjNama.trim().length < 3 || !ef.pjHubungan.trim() || !ef.pjHp.trim()) { err.value = 'Data penanggung jawab wajib lengkap'; return }
  if (!validHp(ef.hp) || !validHp(ef.pjHp)) { err.value = 'No. HP pasien dan penanggung jawab harus nomor seluler Indonesia (mis. 081234567890)'; return }
  if (ef.penjamin === 'BPJS' && !/^\d{13}$/.test(ef.noKartu || '')) { err.value = 'No. kartu BPJS harus 13 digit'; return }
  if (ef.penjamin === 'Asuransi' && (!ef.asuransi.trim() || !ef.noPolis.trim())) { err.value = 'Nama asuransi dan No. polis wajib diisi'; return }
  const d: any = {}
  Object.keys(FIELDS).forEach((t) => FIELDS[t].forEach((x) => { if (!x.ro) d[x.k] = typeof ef[x.k] === 'string' ? ef[x.k].trim() : ef[x.k] }))
  if (d.penjamin !== 'BPJS') d.noKartu = ''
  if (d.penjamin !== 'Asuransi') { d.asuransi = ''; d.noPolis = '' }
  if (!isServerId(pt.value.id)) {
    toast.attempt(() => updatePatient(pt.value.id, d), 'Data pasien diperbarui (data contoh lokal)')
    editing.value = false
    return
  }
  saving.value = true
  try {
    await pasien.update(pt.value.id, { ...d, nik: pt.value.nik })
    toast.ok('Data pasien diperbarui')
    editing.value = false
  } catch (e: any) { err.value = e.message } finally { saving.value = false }
}

const show = (x: F) => {
  const v = pt.value[x.k]
  if (x.k === 'jk') return v === 'L' ? 'Laki-laki' : v === 'P' ? 'Perempuan' : '-'
  if (x.k === 'tglLahir') return `${fmtTgl(v)} (${umur(v)} th)`
  if (x.k === 'nik') return maskNik(v)
  return v || '-'
}

// riwayat & dokumen — hanya field yang ada di respons server
const visits = computed(() => riwayat.value.slice().sort((a: any, b: any) => (a.tanggal + a.dibuat < b.tanggal + b.dibuat ? 1 : -1)))
const docs = computed(() => visits.value.filter((v: any) => v.dokumen).map((v: any) => ({ jenis: v.dokumen, tgl: v.tanggal, poli: v.poliNama, antrean: v.nomorPoli })))

// reservasi
const rsvOpen = ref(false)
const polisAktif = computed(() => db.polis.filter((x: any) => x.aktif))
const rf = reactive({ poliId: '', doctorId: '', tanggal: addDays(todayStr(), 1) })
const dokterRsv = computed(() => (rf.poliId && rf.tanggal ? doctorsOfPoli(rf.poliId, rf.tanggal) : []))
const sesiRsv = computed(() => (rf.doctorId && rf.tanggal ? sessionFor(rf.doctorId, rf.tanggal) : null))
watch(() => [rf.poliId, rf.tanggal], () => { if (!dokterRsv.value.some((d: any) => d.id === rf.doctorId)) rf.doctorId = '' })
const openRsv = () => { rf.poliId = ''; rf.doctorId = ''; rf.tanggal = addDays(todayStr(), 1); rsvOpen.value = true }
const saveRsv = () => {
  if (!rf.poliId || !rf.doctorId || !rf.tanggal) { toast.err('Poli, dokter, dan tanggal wajib diisi'); return }
  const r = toast.attempt(() => createReservation({ patientId: pt.value.id, poliId: rf.poliId, doctorId: rf.doctorId, tanggal: rf.tanggal, kanal: 'loket' }))
  if (r && r !== true) { toast.ok(`Reservasi ${r.kode} dibuat untuk ${fmtTgl(r.tanggal)}`); rsvOpen.value = false }
}

// cetak kartu
const cardOpen = ref(false)
const printCard = () => {
  document.body.classList.add('print-only')
  const done = () => document.body.classList.remove('print-only')
  window.addEventListener('afterprint', done, { once: true })
  window.print()
  setTimeout(done, 1500)
}
</script>

<template>
  <div v-if="pt">
    <PageHead code="FO-04" :role="isKasir ? 'Kasir · tampilan ringkas' : 'Detail pasien'"  title="Detail Pasien & Riwayat" :subtitle="`Identitas longitudinal · ${pt.nama} · ${pt.rm}`">
      <template #actions>
        <template v-if="isFo">
          <NuxtLink :to="'/kunjungan/baru?pasien=' + pt.id" class="btn btn-primary">+ Kunjungan</NuxtLink>
        </template>
      </template>
    </PageHead>

    <PatientBanner :patient="pt" />
    <div v-if="!isFo" class="alert info" style="margin-bottom: 14px"><span>{{ isKasir ? 'Tampilan ringkas untuk kasir.' : '' }} Data pasien bersifat baca saja; perubahan hanya oleh Front Office.</span></div>

    <AppTabs v-model="tab" :tabs="TABS" />

    <div class="kl-cols r350" v-if="['demografi', 'kontak', 'penjamin', 'pj'].includes(tab)">
      <div class="kl-col">
      <div class="panel">
        <h2>{{ TABS.find((t) => t.key === tab)?.label }}</h2>
        <div v-if="isFo" class="row" style="justify-content: flex-end">
          <template v-if="!editing"><button class="btn" @click="startEdit">Edit data</button></template>
          <template v-else><button class="btn" :disabled="saving" @click="editing = false">Batal</button><button class="btn btn-primary" :disabled="saving" @click="saveEdit">{{ saving ? 'Menyimpan…' : 'Simpan perubahan' }}</button></template>
        </div>
        <p v-if="err" class="err-text" role="alert" style="margin-bottom: 10px">{{ err }}</p>
        <dl v-if="!editing" class="kv">
          <template v-for="x in fieldsOf" :key="x.k"><dt>{{ x.l }}</dt><dd>{{ show(x) }}</dd></template>
        </dl>
        <div v-else class="form-grid">
          <div v-for="x in fieldsOf" :key="x.k" class="field" :class="{ full: x.area }">
            <label :for="'e-' + x.k">{{ x.l }}</label>
            <input v-if="x.ro" :id="'e-' + x.k" class="input" :value="maskNik(ef[x.k])" disabled />
            <select v-else-if="x.opt" :id="'e-' + x.k" v-model="ef[x.k]" class="select"><option value="">-</option><option v-for="o in x.opt" :key="o" :value="o">{{ x.k === 'jk' ? (o === 'L' ? 'Laki-laki' : 'Perempuan') : o }}</option></select>
            <textarea v-else-if="x.area" :id="'e-' + x.k" v-model="ef[x.k]" class="textarea" />
            <input v-else :id="'e-' + x.k" v-model="ef[x.k]" class="input" :class="{ mono: NUMERIC[x.k] }" :type="x.type || 'text'" :inputmode="NUMERIC[x.k]?.mode" :maxlength="NUMERIC[x.k]?.max" />
          </div>
        </div>
      </div>
      </div>
      <div class="kl-col">
        <div class="panel">
          <h2>Akses rekam medis</h2>
          <p v-if="pt.alergi" style="font-size: 14px">Alergi: {{ pt.alergi }}</p>
          <p style="font-size: 14px">Penjamin: {{ pt.penjamin || '-' }}</p>
          <div class="row" style="gap: 12px">
            <button v-if="isFo" class="btn" @click="openRsv">+ Reservasi</button>
            <button class="btn" @click="cardOpen = true"><AppIcon name="print" /> Cetak kartu pasien</button>
          </div>
          <p class="muted" style="font-size: 12px">Front Office dapat edit identitas. Dokter / Perawat dan Kasir hanya membaca data demografi.</p>
        </div>
        <div class="panel">
          <h2>Penjamin</h2>
          <div class="guide">Penjamin ditetapkan per kunjungan, bukan mengganti seluruh riwayat.</div>
        </div>
      </div>
    </div>

    <div v-if="tab === 'riwayat' || tab === 'dokumen'" class="panel">
      <h2>{{ tab === 'riwayat' ? 'Riwayat kunjungan' : 'Dokumen EMR & pembayaran' }}</h2>
      <p v-if="tab === 'riwayat' && riwayatErr" class="alert err" role="alert">Gagal memuat riwayat dari server: {{ riwayatErr }}</p>
      <div v-if="tab === 'riwayat'" class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Tanggal</th><th>No. antrean</th><th>Poli</th><th>Dokter</th><th>Jenis</th><th>Penjamin</th><th>Status</th><th>Antrean poli</th></tr></thead>
          <tbody>
            <tr v-for="v in visits" :key="v.id">
              <td data-label="Tanggal">{{ fmtTgl(v.tanggal) }}</td>
              <td data-label="No. antrean" class="mono">{{ v.nomorPoli }}</td>
              <td data-label="Poli">{{ v.poliNama }}</td>
              <td data-label="Dokter">{{ v.dokterNama }}</td>
              <td data-label="Jenis">{{ v.tipe }}</td>
              <td data-label="Penjamin"><StatusBadge :value="v.penjamin" /></td>
              <td data-label="Status"><StatusBadge :value="v.status" /></td>
              <td data-label="Antrean poli"><StatusBadge :value="v.antre" /></td>
            </tr>
            <tr v-if="!visits.length"><td colspan="8" class="empty">{{ riwayatLoading ? 'Memuat riwayat kunjungan…' : 'Belum ada riwayat kunjungan.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="tab === 'dokumen'" class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Jenis dokumen</th><th>Tanggal kunjungan</th><th>Poli</th><th>No. antrean</th></tr></thead>
          <tbody>
            <tr v-for="(d, i) in docs" :key="i">
              <td data-label="Jenis"><span class="badge b-navy">{{ d.jenis }}</span></td>
              <td data-label="Tanggal">{{ fmtTgl(d.tgl) }}</td>
              <td data-label="Poli">{{ d.poli }}</td>
              <td data-label="No. antrean" class="mono">{{ d.antrean }}</td>
            </tr>
            <tr v-if="!docs.length"><td colspan="4" class="empty">Belum ada dokumen.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-model="rsvOpen" title="Tambah reservasi">
      <div class="form-grid">
        <div class="field"><label for="r-poli" class="req">Poli</label>
          <select id="r-poli" v-model="rf.poliId" class="select"><option value="">Pilih poli</option><option v-for="p in polisAktif" :key="p.id" :value="p.id">{{ p.nama }}</option></select></div>
        <div class="field"><label for="r-tgl" class="req">Tanggal (maks. 30 hari)</label><input id="r-tgl" v-model="rf.tanggal" type="date" class="input" :min="todayStr()" :max="addDays(todayStr(), 30)" /></div>
        <div class="field full"><label for="r-dr" class="req">Dokter</label>
          <select id="r-dr" v-model="rf.doctorId" class="select" :disabled="!rf.poliId"><option value="">{{ rf.poliId ? (dokterRsv.length ? 'Pilih dokter' : 'Tidak ada dokter berpraktik') : 'Pilih poli dahulu' }}</option><option v-for="d in dokterRsv" :key="d.id" :value="d.id" :disabled="d.sesi.sisa <= 0">{{ d.nama }} · sisa {{ d.sesi.sisa }}/{{ d.sesi.kuota }}</option></select>
          <span v-if="sesiRsv" class="hint">Jam praktik {{ sesiRsv.mulai }}–{{ sesiRsv.selesai }} · sisa kuota {{ sesiRsv.sisa }}/{{ sesiRsv.kuota }}</span></div>
      </div>
      <template #footer><button class="btn" @click="rsvOpen = false">Tutup</button><button class="btn btn-primary" @click="saveRsv">Simpan reservasi</button></template>
    </AppModal>

    <AppModal v-model="cardOpen" title="Kartu pasien">
      <div class="ticket" style="width: 340px; text-align: left; border-style: solid">
        <div class="bold" style="font-size: 14px">RS SPKD</div>
        <div class="muted">Kartu Berobat Pasien</div>
        <hr />
        <div class="bold" style="font-size: 16px">{{ pt.nama }}</div>
        <div><b>{{ pt.rm }}</b></div>
        <div>Tgl lahir: {{ fmtTgl(pt.tglLahir) }} · {{ pt.jk }}</div>
        <div>Penjamin: {{ pt.penjamin }}</div>
        <div v-if="pt.alergi" style="color: var(--err)">Alergi: {{ pt.alergi }}</div>
      </div>
      <template #footer><button class="btn" @click="cardOpen = false">Tutup</button><button class="btn btn-primary" @click="printCard"><AppIcon name="print" /> Cetak</button></template>
    </AppModal>
  </div>
  <div v-else-if="loading" class="card"><p class="muted">Memuat data pasien…</p></div>
  <div v-else class="card"><p>{{ loadErr || 'Pasien tidak ditemukan.' }}</p><NuxtLink to="/pasien" class="btn" style="margin-top: 12px">Kembali ke daftar pasien</NuxtLink></div>
</template>

<style scoped>
.kl-cols.r350 { grid-template-columns: minmax(0, 1fr) 350px; }
@media (max-width: 900px) { .kl-cols.r350 { grid-template-columns: minmax(0, 1fr); } }
</style>
<style>
@media print {
  body.print-only > *:not(.modal-back) { display: none !important; }
  body.print-only .modal-back { position: static; background: none; padding: 0; display: block; }
  body.print-only .modal { box-shadow: none; max-width: none; max-height: none; }
  body.print-only .modal-h, body.print-only .modal-f { display: none; }
}
</style>
