<script setup lang="ts">
// FO-08 Daftar Reservasi
const { db, patient, poli, doctor, doctorsOfPoli, sessionFor, createReservation, cancelReservation, rescheduleReservation, checkInReservation } = useDb()
const toast = useToast()

const fStatus = ref('')
const semua = ref(false)
const rows = computed(() =>
  db.reservations
    .filter((r: any) => (semua.value || r.tanggal >= todayStr()) && (!fStatus.value || r.status === fStatus.value))
    .slice()
    .sort((a: any, b: any) => (a.tanggal === b.tanggal ? (a.kode > b.kode ? 1 : -1) : a.tanggal > b.tanggal ? 1 : -1)),
)
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
    <PageHead code="FO-08" role="Front Office" title="Daftar Reservasi" subtitle="Satu reservasi per pasien per poli per tanggal. Kuota sesi terpotong saat reservasi dibuat.">
      <template #actions><button class="btn btn-primary" @click="openForm"><AppIcon name="plus" /> Reservasi</button></template>
    </PageHead>

    <div class="card">
      <div class="filters">
        <div class="field"><label for="rs-st" class="small">Status</label>
          <select id="rs-st" v-model="fStatus" class="select"><option value="">Semua status</option><option v-for="s in ['booked', 'check-in', 'batal', 'no-show']" :key="s" :value="s">{{ s }}</option></select></div>
        <label class="check" style="align-self: center"><input v-model="semua" type="checkbox" /><span>Termasuk tanggal lampau</span></label>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kode booking</th><th>Pasien</th><th>Poli</th><th>Dokter</th><th>Tanggal</th><th>Kanal</th><th>Status</th><th /></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td data-label="Kode" class="mono bold">{{ r.kode }}</td>
              <td data-label="Pasien">{{ patient(r.patientId)?.nama }}<div class="muted small">{{ patient(r.patientId)?.rm }}</div></td>
              <td data-label="Poli">{{ poli(r.poliId)?.nama }}</td>
              <td data-label="Dokter">{{ doctor(r.doctorId)?.nama }}</td>
              <td data-label="Tanggal">{{ fmtTgl(r.tanggal) }}<div class="muted small">{{ r.jam }}</div></td>
              <td data-label="Kanal"><StatusBadge :value="r.kanal" /></td>
              <td data-label="Status"><StatusBadge :value="statusOf(r)" /></td>
              <td data-label="">
                <div v-if="r.status === 'booked'" class="row" style="justify-content: flex-end; flex-wrap: nowrap">
                  <button class="btn btn-sm btn-primary" :disabled="r.tanggal !== todayStr()" :title="r.tanggal !== todayStr() ? 'Check-in hanya pada hari H' : ''" @click="checkIn(r)">Check-in</button>
                  <button class="btn btn-sm" @click="openRs(r)">Jadwal ulang</button>
                  <button class="btn btn-sm btn-danger" @click="askBatal(r)">Batalkan</button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length"><td colspan="8" class="empty">Tidak ada reservasi.</td></tr>
          </tbody>
        </table>
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
      <template #footer><button class="btn" @click="formOpen = false">Tutup</button><button class="btn btn-primary" @click="simpan">Simpan reservasi</button></template>
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
