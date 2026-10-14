<script setup lang="ts">
const { db, doctor, sessionFor } = useDb()
const { saveSchedule, deleteSchedule, addCuti, removeCuti, maxTerisi } = useAdmin()
const toast = useToast()
const URUT = [1, 2, 3, 4, 5, 6, 0]
const selDoc = ref<string>(db.doctors[0]?.id || '')
const docSel = computed(() => doctor(selDoc.value))
const jadwal = computed(() =>
  db.schedules.filter((s: any) => s.doctorId === selDoc.value).sort((a: any, b: any) => URUT.indexOf(a.hari) - URUT.indexOf(b.hari)),
)

// ---- form jadwal ----
const show = ref(false)
const blank = () => ({ id: '', doctorId: selDoc.value, hari: 1, mulai: '08:00', selesai: '12:00', kuota: 15, jkn: 10 })
const f = reactive<any>(blank())
const buka = (s?: any) => { Object.assign(f, blank(), s ? { ...s } : {}); show.value = true }
const terisiMin = computed(() => (f.doctorId && f.hari !== '' ? maxTerisi(f.doctorId, Number(f.hari)) : 0))
const simpan = () => {
  const r = toast.attempt(() => saveSchedule({ ...f }))
  if (r) { show.value = false; toast.ok('Jadwal disimpan; sesi 30 hari ke depan diperbarui') }
}
const hapus = (s: any) => {
  if (!confirm(`Hapus jadwal ${hariNama(s.hari)} ${s.mulai}-${s.selesai}?`)) return
  toast.attempt(() => deleteSchedule(s.id), 'Jadwal dihapus')
}

// ---- cuti ----
const showC = ref(false)
const c = reactive<any>({ doctorId: '', tanggal: '', penggantiId: '', alasan: '' })
const bukaC = () => { Object.assign(c, { doctorId: selDoc.value, tanggal: addDays(todayStr(), 1), penggantiId: '', alasan: '' }); showC.value = true }
const sesiCuti = computed(() => (c.doctorId && c.tanggal ? sessionFor(c.doctorId, c.tanggal) : null))
const penggantiOpsi = computed(() => db.doctors.filter((d: any) => d.id !== c.doctorId && c.tanggal && sessionFor(d.id, c.tanggal)))
const simpanC = () => {
  const r = toast.attempt(() => addCuti({ ...c }))
  if (r) { showC.value = false; toast.ok('Cuti dicatat') }
}
const cutiList = computed(() => [...db.cuti].sort((a: any, b: any) => (a.tanggal > b.tanggal ? 1 : -1)))
const batalC = (x: any) => { if (confirm('Batalkan cuti ini?')) { removeCuti(x.id); toast.ok('Cuti dibatalkan') } }

// ---- pratinjau 30 hari ----
const t = todayStr()
const pratinjau = computed(() => {
  const out: any[] = []
  for (let i = 0; i <= 30; i++) {
    const d = addDays(t, i)
    const s = sessionFor(selDoc.value, d)
    if (s) out.push({ tanggal: d, s })
  }
  return out
})
</script>

<template>
  <div>
    <PageHead code="IT-03" role="IT / Superadmin" title="Master Jadwal & Kuota" subtitle="Template jadwal mingguan per dokter. Kuota satu sumber untuk loket, APM, dan reservasi.">
      <template #actions>
        <button class="btn" @click="bukaC">Catat cuti</button>
        <button class="btn btn-primary" @click="buka()">+ Tambah jadwal</button>
      </template>
    </PageHead>

    <div class="alert info" style="margin-bottom: 16px">Sesi harian dibangkitkan otomatis dari template untuk 30 hari ke depan. Kuota tidak boleh di bawah jumlah yang sudah terisi.</div>

    <div class="card" style="margin-bottom: 16px">
      <div class="filters">
        <div class="field"><label for="j-dok">Dokter</label>
          <select id="j-dok" v-model="selDoc" class="select" style="min-width: 240px"><option v-for="d in db.doctors" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
        </div>
      </div>
      <h2>Template mingguan{{ docSel ? ' · ' + docSel.nama : '' }}</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Hari</th><th>Jam praktik</th><th class="right">Kuota total</th><th class="right">JKN</th><th class="right">Non-JKN</th><th class="right">Terisi (maks.)</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="s in jadwal" :key="s.id">
              <td data-label="Hari"><b>{{ hariNama(s.hari) }}</b></td>
              <td data-label="Jam praktik">{{ s.mulai }} - {{ s.selesai }}</td>
              <td data-label="Kuota total" class="right">{{ s.kuota }}</td>
              <td data-label="JKN" class="right">{{ s.jkn }}</td>
              <td data-label="Non-JKN" class="right">{{ s.kuota - s.jkn }}</td>
              <td data-label="Terisi (maks.)" class="right">{{ maxTerisi(s.doctorId, s.hari) }}</td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px"><button class="btn btn-sm" @click="buka(s)">Ubah</button><button class="btn btn-sm btn-danger" @click="hapus(s)">Hapus</button></div>
              </td>
            </tr>
            <tr v-if="!jadwal.length"><td colspan="7" class="empty">Dokter ini belum punya jadwal</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px">
      <h2>Cuti & dokter pengganti</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Tanggal</th><th>Dokter</th><th>Pengganti</th><th>Alasan</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="x in cutiList" :key="x.id">
              <td data-label="Tanggal">{{ fmtTglPanjang(x.tanggal) }}</td>
              <td data-label="Dokter">{{ doctor(x.doctorId)?.nama }}</td>
              <td data-label="Pengganti">{{ x.penggantiId ? doctor(x.penggantiId)?.nama : 'Tanpa pengganti (kuota 0)' }}</td>
              <td data-label="Alasan">{{ x.alasan }}</td>
              <td data-label="Aksi"><button class="btn btn-sm btn-danger" @click="batalC(x)">Batalkan</button></td>
            </tr>
            <tr v-if="!cutiList.length"><td colspan="5" class="empty">Belum ada cuti tercatat</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Pratinjau sesi 30 hari ke depan{{ docSel ? ' · ' + docSel.nama : '' }}</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Tanggal</th><th>Jam</th><th class="right">Kuota</th><th class="right">Terisi</th><th class="right">Sisa</th><th>Catatan</th></tr></thead>
          <tbody>
            <tr v-for="r in pratinjau" :key="r.tanggal" :class="{ hl: r.tanggal === t }">
              <td data-label="Tanggal">{{ fmtTglPanjang(r.tanggal) }}</td>
              <td data-label="Jam">{{ r.s.mulai }} - {{ r.s.selesai }}</td>
              <td data-label="Kuota" class="right">{{ r.s.kuota }}</td>
              <td data-label="Terisi" class="right">{{ r.s.terisi }}</td>
              <td data-label="Sisa" class="right"><b>{{ r.s.sisa }}</b></td>
              <td data-label="Catatan">
                <span v-if="r.s.cuti" class="badge b-warn">Cuti{{ r.s.cuti.penggantiId ? ' · pengganti ' + doctor(r.s.cuti.penggantiId)?.nama : ' · tanpa pengganti' }}</span>
                <span v-else-if="r.s.sisa === 0" class="badge b-err">Penuh</span>
                <span v-else class="muted">-</span>
              </td>
            </tr>
            <tr v-if="!pratinjau.length"><td colspan="6" class="empty">Tidak ada sesi dalam 30 hari ke depan</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-model="show" :title="f.id ? 'Ubah jadwal' : 'Tambah jadwal'">
      <div class="form-grid">
        <div class="field full"><label class="req" for="js-dok">Dokter</label>
          <select id="js-dok" v-model="f.doctorId" class="select"><option v-for="d in db.doctors" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
        </div>
        <div class="field"><label class="req" for="js-hari">Hari</label>
          <select id="js-hari" v-model.number="f.hari" class="select"><option v-for="h in URUT" :key="h" :value="h">{{ hariNama(h) }}</option></select>
        </div>
        <div class="field"><label class="req" for="js-kuota">Kuota total</label><input id="js-kuota" v-model.number="f.kuota" type="number" min="1" class="input" /></div>
        <div class="field"><label class="req" for="js-mulai">Jam mulai</label><input id="js-mulai" v-model="f.mulai" type="time" class="input" /></div>
        <div class="field"><label class="req" for="js-selesai">Jam selesai</label><input id="js-selesai" v-model="f.selesai" type="time" class="input" /></div>
        <div class="field"><label for="js-jkn">Porsi JKN</label><input id="js-jkn" v-model.number="f.jkn" type="number" min="0" class="input" /></div>
        <div class="field"><label>Porsi non-JKN</label><input class="input" :value="Math.max(0, (Number(f.kuota) || 0) - (Number(f.jkn) || 0))" disabled /></div>
      </div>
      <p class="hint">Jumlah terisi tertinggi pada hari tersebut dalam 30 hari ke depan: <b>{{ terisiMin }}</b>. Kuota tidak boleh lebih kecil dari angka ini.</p>
      <template #footer><button class="btn" @click="show = false">Batal</button><button class="btn btn-primary" @click="simpan">Simpan</button></template>
    </AppModal>

    <AppModal v-model="showC" title="Catat cuti dokter">
      <div class="form-grid">
        <div class="field"><label class="req" for="c-dok">Dokter</label>
          <select id="c-dok" v-model="c.doctorId" class="select"><option v-for="d in db.doctors" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
        </div>
        <div class="field"><label class="req" for="c-tgl">Tanggal</label><input id="c-tgl" v-model="c.tanggal" type="date" class="input" :min="t" /></div>
        <div class="field full"><label for="c-peng">Dokter pengganti</label>
          <select id="c-peng" v-model="c.penggantiId" class="select"><option value="">Tanpa pengganti</option><option v-for="d in penggantiOpsi" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
          <span class="hint">Hanya dokter yang berpraktik pada tanggal tersebut.</span>
        </div>
        <div class="field full"><label class="req" for="c-alasan">Alasan</label><input id="c-alasan" v-model="c.alasan" class="input" /></div>
      </div>
      <p v-if="sesiCuti" class="hint">Terisi pada tanggal itu: {{ sesiCuti.terisi }}. <b v-if="sesiCuti.terisi > 0">Pilih dokter pengganti agar pasien tetap terlayani.</b></p>
      <p v-else-if="c.doctorId && c.tanggal" class="err-text">Dokter tidak punya jadwal pada tanggal ini.</p>
      <template #footer><button class="btn" @click="showC = false">Batal</button><button class="btn btn-primary" @click="simpanC">Simpan cuti</button></template>
    </AppModal>
  </div>
</template>
