<script setup lang="ts">
// FO-08 Daftar Reservasi
const { db, patient, poli, doctor, doctorsOfPoli, sessionFor, createReservation, cancelReservation, rescheduleReservation, checkInReservation } = useDb()
const toast = useToast()

const fStatus = ref('')
const fPoli = ref('')
const fCari = ref('')
const tab = ref('hari')
const inTab = (r: any, k: string) => (k === 'hari' ? r.tanggal === todayStr() : k === 'depan' ? r.tanggal > todayStr() : true)
const tabs = computed(() => [
  { key: 'hari', label: `Hari ini · ${db.reservations.filter((r: any) => inTab(r, 'hari')).length}` },
  { key: 'depan', label: `Mendatang · ${db.reservations.filter((r: any) => inTab(r, 'depan')).length}` },
  { key: 'semua', label: 'Semua' },
])
const rows = computed(() => {
  const s = fCari.value.trim().toLowerCase()
  return db.reservations
    .filter((r: any) => inTab(r, tab.value) && (!fStatus.value || r.status === fStatus.value) && (!fPoli.value || r.poliId === fPoli.value) &&
      (!s || r.kode.toLowerCase().includes(s) || (patient(r.patientId)?.nama || '').toLowerCase().includes(s) || (patient(r.patientId)?.rm || '').includes(s)))
    .slice()
    .sort((a: any, b: any) => (a.tanggal === b.tanggal ? (a.kode > b.kode ? 1 : -1) : a.tanggal > b.tanggal ? 1 : -1))
})
const statusOf = (r: any) => (r.status === 'booked' && r.tanggal < todayStr() ? 'no-show' : r.status)

// tambah
const formOpen = ref(false)
const f = reactive({ patientId: '', poliId: '', doctorId: '', tanggal: addDays(todayStr(), 1) })
const q = ref('')
const hits = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (s.length < 2 || f.patientId) return []
  return db.patients.filter((p: any) => p.nama.toLowerCase().includes(s) || p.rm.includes(s) || p.nik.includes(s)).slice(0, 5)
})
const picked = computed(() => (f.patientId ? patient(f.patientId) : null))
const pilihPasien = (p: any) => { f.patientId = p.id; q.value = '' }
const polisAktif = computed(() => db.polis.filter((p: any) => p.aktif))
const dokters = computed(() => (f.poliId && f.tanggal ? doctorsOfPoli(f.poliId, f.tanggal) : []))
const sesi = computed(() => (f.doctorId && f.tanggal ? sessionFor(f.doctorId, f.tanggal) : null))
watch(() => [f.poliId, f.tanggal], () => { if (!dokters.value.some((d: any) => d.id === f.doctorId)) f.doctorId = '' })
const openForm = () => { f.patientId = ''; f.poliId = ''; f.doctorId = ''; f.tanggal = addDays(todayStr(), 1); q.value = ''; formOpen.value = true }
const simpan = () => {
  if (!f.patientId) { toast.err('Pilih pasien terlebih dahulu'); return }
  if (!f.poliId || !f.doctorId || !f.tanggal) { toast.err('Poli, dokter, dan tanggal wajib diisi'); return }
  const r = toast.attempt(() => createReservation({ patientId: f.patientId, poliId: f.poliId, doctorId: f.doctorId, tanggal: f.tanggal, kanal: 'loket' }))
  if (r && r !== true) { toast.ok(`Reservasi ${r.kode} dibuat`); formOpen.value = false }
}

const checkIn = (r: any) => {
  const v = toast.attempt(() => checkInReservation(r.id))
  if (v && v !== true) toast.ok(`Check-in berhasil. Nomor antrean ${v.antreanPoli.nomor}`)
}

// jadwal ulang
const rsOpen = ref(false)
const rs = ref<any>(null)
const rsTgl = ref('')
const rsSesi = computed(() => (rs.value && rsTgl.value ? sessionFor(rs.value.doctorId, rsTgl.value) : null))
const openRs = (r: any) => { rs.value = r; rsTgl.value = r.tanggal; rsOpen.value = true }
const doRs = () => {
  if (!rsTgl.value || rsTgl.value < todayStr() || rsTgl.value > addDays(todayStr(), 30)) { toast.err('Tanggal harus dalam 30 hari ke depan'); return }
  const ok = toast.attempt(() => rescheduleReservation(rs.value.id, rsTgl.value), 'Reservasi dijadwalkan ulang')
  if (ok) rsOpen.value = false
}

// batal
const bOpen = ref(false)
const b = ref<any>(null)
const askBatal = (r: any) => { b.value = r; bOpen.value = true }
const doBatal = () => { toast.attempt(() => cancelReservation(b.value.id), `Reservasi ${b.value.kode} dibatalkan`); bOpen.value = false }
</script>

<template>
  <div>
    <PageHead code="FO-08" role="Front Office / Admin" title="Daftar Reservasi & Booking Mobile JKN" subtitle="Pendaftaran online, booking Mobile JKN, dan reservasi manual · Maksimal 30 hari ke depan">
      <template #actions><button class="btn btn-primary" @click="openForm"><AppIcon name="plus" /> Tambah reservasi</button></template>
    </PageHead>

    <AppTabs v-model="tab" :tabs="tabs" />

    <div class="kl-filters">
      <select v-model="fPoli" class="select" aria-label="Filter poli"><option value="">Semua poli</option><option v-for="p in polisAktif" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
      <select id="rs-st" v-model="fStatus" class="select" aria-label="Filter status"><option value="">Semua status</option><option v-for="s in ['booked', 'check-in', 'batal', 'no-show']" :key="s" :value="s">{{ s }}</option></select>
      <input v-model="fCari" class="input q" placeholder="Cari pasien / booking" aria-label="Cari pasien atau booking" />
    </div>

    <div class="kl-cols">
      <div class="kl-col">
        <div class="panel">
          <h2>Reservasi &amp; check-in</h2>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Kode Booking</th><th>NIK</th><th>No BPJS</th><th>Hari/Tgl Berobat</th><th>Jam Estimasi</th><th>Status Check-in</th><th>Kanal</th><th>Poli / dokter</th><th>Pasien / RM</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in rows" :key="r.id" :class="{ sel: i === 0 }">
                  <td data-label="Kode" class="mono bold">{{ r.kode }}</td>
                  <td data-label="NIK">{{ patient(r.patientId)?.nik || '-' }}</td>
                  <td data-label="No BPJS">{{ patient(r.patientId)?.noKartu || '-' }}</td>
                  <td data-label="Tanggal">{{ fmtTgl(r.tanggal) }}</td>
                  <td data-label="Jam">{{ r.jam }}</td>
                  <td data-label="Status"><StatusBadge :value="statusOf(r)" /></td>
                  <td data-label="Kanal"><StatusBadge :value="r.kanal" /></td>
                  <td data-label="Poli / dokter">{{ poli(r.poliId)?.nama }}<div class="muted small">{{ doctor(r.doctorId)?.nama }}</div></td>
                  <td data-label="Pasien">{{ patient(r.patientId)?.nama }}<div class="muted small">{{ patient(r.patientId)?.rm }}</div></td>
                  <td data-label="Aksi">
                    <div v-if="r.status === 'booked'" class="row" style="flex-wrap: wrap">
                      <button class="btn btn-sm btn-primary" :disabled="r.tanggal !== todayStr()" :title="r.tanggal !== todayStr() ? 'Check-in hanya pada hari H' : ''" @click="checkIn(r)">Check-in Manual Pasien</button>
                      <button class="btn btn-sm" @click="openRs(r)">Reschedule/Ubah Jadwal</button>
                      <button class="btn btn-sm btn-danger" @click="askBatal(r)">Batalkan Booking</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!rows.length"><td colspan="10" class="empty">Tidak ada reservasi.</td></tr>
              </tbody>
            </table>
          </div>
          <p class="muted" style="font-size: 12px">{{ rows.length }} reservasi ditampilkan · Status Booked berubah menjadi Check-in saat check-in manual dilakukan. Nomor antrean poli aktif diterbitkan tanpa mengambil kuota kedua kali.</p>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Aturan Kuota JKN Mobile / Non-Mobile / Umum</h2>
          <div class="guide">Kuota dibagi menjadi tiga kanal: JKN Mobile, JKN Non-Mobile, dan Umum. Satu pasien / poli / tanggal hanya dapat memiliki satu reservasi aktif.</div>
          <p>JKN Mobile untuk booking aplikasi Mobile JKN. JKN Non-Mobile untuk pasien BPJS dari Loket/APM. Non-JKN/Umum untuk pasien non-BPJS.</p>
          <p>Jadwal penuh tidak dapat dipilih. Jadwal ulang memindahkan alokasi kuota ke slot baru; pembatalan melepaskan kuota agar tersedia kembali.</p>
        </div>
      </div>
    </div>

    <AppModal v-model="formOpen" title="Tambah reservasi">
      <div class="form-grid">
        <div class="field full">
          <label class="req" for="rf-q">Pasien</label>
          <div v-if="picked" class="row between alert"><span><b>{{ picked.nama }}</b> · {{ picked.rm }}</span><button class="btn btn-sm" @click="f.patientId = ''">Ganti</button></div>
          <template v-else>
            <input id="rf-q" v-model="q" class="input" placeholder="Cari nama / No. RM / NIK (min. 2 karakter)" autocomplete="off" />
            <div v-if="hits.length" class="table-wrap">
              <button v-for="p in hits" :key="p.id" type="button" class="btn btn-ghost btn-block" style="justify-content: flex-start; border-radius: 0" @click="pilihPasien(p)">{{ p.nama }} · {{ p.rm }}</button>
            </div>
            <span v-else-if="q.trim().length >= 2" class="hint">Pasien tidak ditemukan.</span>
          </template>
        </div>
        <div class="field"><label class="req" for="rf-poli">Poli</label>
          <select id="rf-poli" v-model="f.poliId" class="select"><option value="">Pilih poli</option><option v-for="p in polisAktif" :key="p.id" :value="p.id">{{ p.nama }}</option></select></div>
        <div class="field"><label class="req" for="rf-tgl">Tanggal (maks. 30 hari)</label><input id="rf-tgl" v-model="f.tanggal" type="date" class="input" :min="todayStr()" :max="addDays(todayStr(), 30)" /></div>
        <div class="field full"><label class="req" for="rf-dr">Dokter</label>
          <select id="rf-dr" v-model="f.doctorId" class="select" :disabled="!f.poliId"><option value="">{{ f.poliId ? (dokters.length ? 'Pilih dokter' : 'Tidak ada dokter berpraktik') : 'Pilih poli dahulu' }}</option><option v-for="d in dokters" :key="d.id" :value="d.id" :disabled="d.sesi.sisa <= 0">{{ d.nama }} · sisa {{ d.sesi.sisa }}/{{ d.sesi.kuota }}</option></select>
          <span v-if="sesi" class="hint">Jam praktik {{ sesi.mulai }}–{{ sesi.selesai }} · sisa kuota {{ sesi.sisa }}/{{ sesi.kuota }}</span></div>
      </div>
      <template #footer><button class="btn" @click="formOpen = false">Tutup</button><button class="btn btn-primary" @click="simpan">Tambah</button></template>
    </AppModal>

    <AppModal v-model="rsOpen" title="Jadwal ulang reservasi">
      <template v-if="rs">
        <p style="margin-bottom: 12px"><b>{{ rs.kode }}</b> · {{ patient(rs.patientId)?.nama }} · {{ doctor(rs.doctorId)?.nama }}</p>
        <div class="field"><label for="rs-tgl" class="req">Tanggal baru</label><input id="rs-tgl" v-model="rsTgl" type="date" class="input" :min="todayStr()" :max="addDays(todayStr(), 30)" /></div>
        <p v-if="rsTgl && !rsSesi" class="err-text" style="margin-top: 8px">Dokter tidak berpraktik pada tanggal ini.</p>
        <p v-else-if="rsSesi" class="hint">Sisa kuota {{ rsSesi.sisa }}/{{ rsSesi.kuota }}</p>
      </template>
      <template #footer><button class="btn" @click="rsOpen = false">Tutup</button><button class="btn btn-primary" @click="doRs">Simpan</button></template>
    </AppModal>

    <AppModal v-model="bOpen" title="Batalkan reservasi">
      <p v-if="b">Batalkan reservasi <b>{{ b.kode }}</b> atas nama {{ patient(b.patientId)?.nama }}? Kuota sesi akan dilepas.</p>
      <template #footer><button class="btn" @click="bOpen = false">Tutup</button><button class="btn btn-solid-danger" @click="doBatal">Ya, batalkan</button></template>
    </AppModal>
  </div>
</template>
