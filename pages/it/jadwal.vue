<script setup lang="ts">
// IT-03 Master Jadwal & Kuota — template mingguan per dokter dengan kuota 3 kanal; sesi harian dibangkitkan 30 hari.
// Belum ada endpoint jadwal di backend: simulasi lokal (satu sumber kuota untuk loket / APM / reservasi).
const { db, doctor, poli, sessionFor } = useDb()
const { deleteSchedule, addCuti, removeCuti, maxTerisi } = useAdmin()
const { saveTemplate, syncHfisJadwal } = useIt()
const toast = useToast()
const URUT = [1, 2, 3, 4, 5, 6, 0]
const t = todayStr()
const jam = (s?: string) => (s ? s.replace(':', '.') : '—')
const pendek = (nama?: string) => (nama || '').replace(/^(dr|drg)\.\s*/i, '').split(/[ ,]/)[0]

// ---- filter: minggu, poli, dokter ----
const senin = (d: string) => addDays(d, -((new Date(d + 'T00:00:00').getDay() + 6) % 7))
const minggu = Array.from({ length: 5 }, (_, i) => addDays(senin(t), i * 7))
const fmtMinggu = (a: string) => {
  const b = addDays(a, 6)
  return `${a.slice(5, 7) === b.slice(5, 7) ? Number(a.slice(8)) : fmtTglPendek(a)}–${fmtTgl(b)}`
}
const selMinggu = ref(minggu[0])
const selPoli = ref('')
const dokterOpsi = computed(() => db.doctors.filter((d: any) => d.aktif !== false && (!selPoli.value || d.poliId === selPoli.value)))
const selDoc = ref<string>(dokterOpsi.value[0]?.id || '')
watch(dokterOpsi, (l) => { if (!l.some((d: any) => d.id === selDoc.value)) selDoc.value = l[0]?.id || '' })
const docSel = computed(() => doctor(selDoc.value))

// ---- template mingguan ----
const tpl = computed(() => URUT.map((h) => ({ hari: h, s: db.schedules.find((x: any) => x.doctorId === selDoc.value && x.hari === h) })))
const efektifMulai = computed(() => tpl.value.map((x) => x.s?.efektif).filter(Boolean).sort()[0])

// ---- form edit template (panel bawah) ----
const blank = () => ({ id: '', doctorId: selDoc.value, hari: 1, mulai: '08:00', selesai: '12:00', mobile: 10, nonMobile: 10, nonJkn: 10, efektif: t })
const f = reactive<any>(blank())
const edit = ref(false)
const buka = (s?: any, hari?: number) => {
  Object.assign(f, blank(), s ? { ...s, efektif: s.efektif && s.efektif > t ? s.efektif : t } : {}, hari != null && !s ? { hari } : {})
  edit.value = true
}
const bukaBaru = () => {
  const kosong = URUT.find((h) => !tpl.value.find((x) => x.hari === h)?.s)
  if (kosong == null) return toast.warn('Semua hari sudah punya template. Gunakan Edit.')
  buka(undefined, kosong)
}
watch(selDoc, () => { const s = tpl.value.find((x) => x.s)?.s; s ? buka(s) : (edit.value = false) }, { immediate: true })
const total = computed(() => ['mobile', 'nonMobile', 'nonJkn'].reduce((a, k) => a + (Number(f[k]) || 0), 0))
const terisiMin = computed(() => (f.doctorId ? maxTerisi(f.doctorId, Number(f.hari)) : 0))
const simpan = () => {
  const r = toast.attempt(() => saveTemplate({ ...f }))
  if (r) { buka(r); toast.ok('Template disimpan · sesi 30 hari diperbarui · antre sinkron HFIS') }
}

// ---- sesi harian & pengecualian (minggu terpilih) ----
const sesi = computed(() => {
  const out: any[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(selMinggu.value, i)
    const s = sessionFor(selDoc.value, d)
    if (!s) continue
    const nm = pendek(docSel.value?.nama)
    if (s.cuti) {
      out.push({ key: d + 'c', tanggal: d, s, label: `${nm} · Cuti`, kuota: 0, terisi: 0, sisa: 0, status: 'Cuti', cls: 'b-warn' })
      const pg = s.cuti.penggantiId && sessionFor(s.cuti.penggantiId, d)
      if (pg) out.push({ key: d + 'p', tanggal: d, s: pg, cuti: s.cuti, label: `${doctor(s.cuti.penggantiId)?.nama} · Pengganti`, kuota: pg.kuota, terisi: pg.terisi + s.terisi, sisa: Math.max(0, pg.kuota - pg.terisi - s.terisi), status: 'Pengganti', cls: 'b-navy' })
    } else out.push({ key: d, tanggal: d, s, label: `${nm} · ${jam(s.mulai)}–${jam(s.selesai)}`, kuota: s.kuota, terisi: s.terisi, sisa: s.sisa, status: d < t ? 'Selesai' : 'Aktif', cls: d < t ? 'b-mute' : 'b-ok' })
  }
  return out
})
const selSesi = ref('')
const sesiAktif = computed(() => sesi.value.find((x) => x.key === selSesi.value) || null)
const hariSesi = computed(() => (sesiAktif.value ? new Date(sesiAktif.value.tanggal + 'T00:00:00').getDay() : null))
const editSesi = () => {
  if (!sesiAktif.value) return toast.warn('Pilih sesi pada tabel terlebih dahulu')
  const s = db.schedules.find((x: any) => x.doctorId === selDoc.value && x.hari === hariSesi.value)
  if (s) buka(s)
}
const hapusTpl = () => {
  const s = db.schedules.find((x: any) => x.id === f.id)
  if (!edit.value || !s) return toast.warn('Pilih template yang akan dihapus')
  if (!confirm(`Hapus template ${hariNama(s.hari)} ${s.mulai}–${s.selesai}? Hanya template tanpa pasien/reservasi yang dapat dihapus.`)) return
  if (toast.attempt(() => deleteSchedule(s.id), 'Template dihapus')) edit.value = false
}
const batalCuti = () => {
  const c = sesiAktif.value?.s?.cuti || sesiAktif.value?.cuti
  if (!c) return
  if (confirm('Batalkan pengecualian (cuti) ini?')) { removeCuti(c.id); selSesi.value = ''; toast.ok('Pengecualian dibatalkan') }
}
const sync = () => { syncHfisJadwal(); toast.ok('Jadwal tersinkron ke BPJS HFIS (mock)') }
const antreHfis = computed(() => db.outbox.filter((o: any) => o.modul === 'BPJS HFIS' && o.status !== 'terkirim').length)

// ---- catat cuti / dokter pengganti ----
const showC = ref(false)
const modePengganti = ref(false)
const c = reactive<any>({ doctorId: '', tanggal: '', penggantiId: '', alasan: '' })
const bukaC = (pengganti = false) => {
  const tgl = sesiAktif.value && sesiAktif.value.tanggal >= t ? sesiAktif.value.tanggal : addDays(t, 1)
  Object.assign(c, { doctorId: selDoc.value, tanggal: tgl, penggantiId: '', alasan: '' })
  modePengganti.value = pengganti
  showC.value = true
}
const sesiCuti = computed(() => (c.doctorId && c.tanggal ? sessionFor(c.doctorId, c.tanggal) : null))
const penggantiOpsi = computed(() => db.doctors.filter((d: any) => d.id !== c.doctorId && c.tanggal && sessionFor(d.id, c.tanggal)))
const simpanC = () => {
  if (modePengganti.value && !c.penggantiId) return toast.err('Dokter pengganti wajib dipilih')
  const r = toast.attempt(() => addCuti({ ...c }))
  if (r) { showC.value = false; toast.ok(c.penggantiId ? 'Cuti & dokter pengganti dicatat' : 'Cuti dicatat') }
}
</script>

<template>
  <div>
    <PageHead code="IT-03" role="IT" title="Master Jadwal & Kuota" subtitle="Template mingguan dokter · Sesi harian otomatis untuk 30 hari ke depan · Sinkron otomatis HFIS" />
    <div class="kl-filters" style="margin-bottom: 24px">
      <label class="sr-only" for="j-mg">Minggu</label>
      <select id="j-mg" v-model="selMinggu" class="select"><option v-for="m in minggu" :key="m" :value="m">{{ fmtMinggu(m) }}</option></select>
      <label class="sr-only" for="j-poli">Poli</label>
      <select id="j-poli" v-model="selPoli" class="select"><option value="">Semua poli</option><option v-for="p in db.polis.filter((x: any) => x.aktif)" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
      <label class="sr-only" for="j-dok">Dokter</label>
      <select id="j-dok" v-model="selDoc" class="select"><option v-for="d in dokterOpsi" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
      <button class="btn" :disabled="!selDoc" @click="bukaBaru">+ Template</button>
      <button class="btn" :disabled="!selDoc" @click="bukaC(false)">Catat cuti</button>
      <button class="btn" :disabled="!selDoc" @click="bukaC(true)">Dokter pengganti</button>
    </div>

    <div class="panel">
      <h2>Template mingguan · {{ docSel?.nama || '-' }}</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Hari</th><th>Mulai</th><th>Selesai</th><th>Total</th><th>JKN Mobile</th><th>JKN Non-Mobile<br />(Loket/APM)</th><th>Non-JKN/Umum</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="r in tpl" :key="r.hari" :class="{ sel: edit && f.id && r.s?.id === f.id }">
              <td data-label="Hari">{{ hariNama(r.hari) }}</td>
              <td data-label="Mulai">{{ jam(r.s?.mulai) }}</td>
              <td data-label="Selesai">{{ jam(r.s?.selesai) }}</td>
              <td data-label="Total">{{ r.s?.kuota ?? 0 }}</td>
              <td data-label="JKN Mobile">{{ r.s?.mobile ?? 0 }}</td>
              <td data-label="JKN Non-Mobile">{{ r.s?.nonMobile ?? 0 }}</td>
              <td data-label="Non-JKN/Umum">{{ r.s?.nonJkn ?? 0 }}</td>
              <td data-label="Aksi"><button v-if="r.s" class="link" @click="buka(r.s)">Edit</button><button v-else class="link" :title="'Tambah template ' + hariNama(r.hari)" @click="buka(undefined, r.hari)">Libur</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="muted">Template aktif · Total = JKN Mobile + JKN Non-Mobile (Loket/APM) + Non-JKN/Umum{{ efektifMulai ? ' · Berlaku mulai ' + fmtTglPanjang(efektifMulai).split(', ')[1] : '' }}.</p>
    </div>

    <div class="panel" style="margin-top: 16px">
      <h2>Sesi harian &amp; pengecualian</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Tanggal</th><th>Dokter / sesi</th><th>Kuota</th><th>Terisi</th><th>Sisa</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="r in sesi" :key="r.key" class="click" :class="{ sel: selSesi === r.key }" @click="selSesi = r.key">
              <td data-label="Tanggal">{{ fmtTgl(r.tanggal) }}</td>
              <td data-label="Dokter / sesi">{{ r.label }}</td>
              <td data-label="Kuota">{{ r.kuota }}</td>
              <td data-label="Terisi">{{ r.terisi }}</td>
              <td data-label="Sisa">{{ r.sisa }}</td>
              <td data-label="Status"><span class="badge st" :class="r.cls">{{ r.status }}</span></td>
            </tr>
            <tr v-if="!sesi.length"><td colspan="6" class="empty">Tidak ada sesi praktik pada minggu ini.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="kl-actions" style="align-items: flex-start">
        <button class="btn" @click="bukaC(false)">Tambah pengecualian</button>
        <button class="btn" :disabled="!sesiAktif" @click="editSesi">Edit sesi</button>
        <button v-if="sesiAktif?.status === 'Cuti' || sesiAktif?.status === 'Pengganti'" class="btn" @click="batalCuti">Batalkan pengecualian</button>
        <button class="btn" :disabled="!edit || !f.id" @click="hapusTpl">Hapus draf template</button>
        <button class="btn" @click="sync">Sync ke BPJS HFIS</button>
        <div class="sync">
          <b>Sync otomatis</b>
          <span v-if="antreHfis">Mock · {{ antreHfis }} perubahan menunggu sinkron</span>
          <span v-else>Mock · Sinkron berhasil</span>
          <span>{{ db.jadwalSync?.at ? fmtTgl(db.jadwalSync.at) + ' · ' + fmtJamDetik(db.jadwalSync.at) : '-' }}</span>
          <span>Sinkron otomatis HFIS aktif (demo)</span>
        </div>
      </div>
    </div>

    <div v-if="edit" class="panel" style="margin-top: 16px">
      <h2>{{ f.id ? 'Edit template' : 'Tambah template' }} · {{ hariNama(Number(f.hari)) }}</h2>
      <div class="field"><label class="req" for="t-dok">Dokter / poli</label><input id="t-dok" class="input" :value="`${doctor(f.doctorId)?.nama} / ${poli(doctor(f.doctorId)?.poliId)?.kode || '-'}`" disabled /></div>
      <div class="field"><label class="req" for="t-hari">Hari</label>
        <select id="t-hari" v-model.number="f.hari" class="select" :disabled="!!f.id"><option v-for="h in URUT" :key="h" :value="h" :disabled="!f.id && !!tpl.find((x) => x.hari === h)?.s">{{ hariNama(h) }}</option></select>
      </div>
      <div class="kl-cols half">
        <div class="field"><label class="req" for="t-mulai">Mulai</label><input id="t-mulai" v-model="f.mulai" type="time" class="input" /></div>
        <div class="field"><label class="req" for="t-sel">Selesai</label><input id="t-sel" v-model="f.selesai" type="time" class="input" /></div>
      </div>
      <div class="field"><label class="req" for="t-tot">Total kuota</label><input id="t-tot" class="input" :value="total" disabled /></div>
      <div class="tri">
        <div class="field"><label for="t-mob">JKN Mobile</label><input id="t-mob" v-model.number="f.mobile" type="number" min="0" class="input" /></div>
        <div class="field"><label for="t-nm">JKN Non-Mobile (Loket/APM)</label><input id="t-nm" v-model.number="f.nonMobile" type="number" min="0" class="input" /></div>
        <div class="field"><label for="t-nj">Non-JKN/Umum</label><input id="t-nj" v-model.number="f.nonJkn" type="number" min="0" class="input" /></div>
      </div>
      <div class="field"><label class="req" for="t-ef">Tanggal efektif</label><input id="t-ef" v-model="f.efektif" type="date" class="input" :min="t" /></div>
      <div><span class="badge" :class="total < terisiMin ? 'b-err' : 'b-warn'">{{ terisiMin }} terisi · Minimal kuota {{ terisiMin }}</span></div>
      <div class="guide" :class="{ err: total < terisiMin }">Total otomatis = {{ f.mobile || 0 }} + {{ f.nonMobile || 0 }} + {{ f.nonJkn || 0 }} = {{ total }}. Terisi {{ terisiMin }}; total tidak boleh kurang dari {{ terisiMin }}. Reservasi per kanal tidak boleh melampaui kuota dan kuota kanal tidak boleh dikurangi di bawah jumlah terisi. Reservasi existing tidak dibatalkan.</div>
      <div class="kl-actions">
        <button class="btn btn-primary" @click="simpan">Simpan template</button>
        <button class="btn" @click="edit = false">Batal</button>
      </div>
    </div>

    <div class="guide" style="margin-top: 16px">Transaksi SIMRS atomik: cek kuota kanal, reservasi, dan pengurangan sisa dalam satu commit. Loket/APM/Reservasi tidak overbooking. Sesi otomatis 30 hari; cuti dan pengganti tercatat audit. HFIS dikirim asynchronous melalui outbox demo.</div>

    <AppModal v-model="showC" :title="modePengganti ? 'Dokter pengganti' : 'Catat cuti / pengecualian'">
      <div class="form-grid">
        <div class="field"><label class="req" for="c-dok">Dokter</label>
          <select id="c-dok" v-model="c.doctorId" class="select"><option v-for="d in db.doctors.filter((x: any) => x.aktif !== false)" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
        </div>
        <div class="field"><label class="req" for="c-tgl">Tanggal</label><input id="c-tgl" v-model="c.tanggal" type="date" class="input" :min="t" /></div>
        <div class="field full"><label :class="{ req: modePengganti || (sesiCuti?.terisi || 0) > 0 }" for="c-pg">Dokter pengganti</label>
          <select id="c-pg" v-model="c.penggantiId" class="select"><option value="">Tanpa pengganti (sesi ditutup)</option><option v-for="d in penggantiOpsi" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
          <span v-if="!sesiCuti" class="hint">Dokter tidak punya jadwal pada tanggal ini.</span>
          <span v-else-if="sesiCuti.terisi" class="hint">Sudah ada {{ sesiCuti.terisi }} pasien/reservasi: wajib pilih dokter pengganti.</span>
          <span v-else-if="!penggantiOpsi.length" class="hint">Tidak ada dokter lain yang berpraktik pada tanggal ini.</span>
        </div>
        <div class="field full"><label class="req" for="c-al">Alasan</label><input id="c-al" v-model="c.alasan" class="input" maxlength="200" placeholder="mis. Cuti tahunan" /></div>
      </div>
      <template #footer><button class="btn" @click="showC = false">Batal</button><button class="btn btn-primary" @click="simpanC">Simpan</button></template>
    </AppModal>
  </div>
</template>

<style scoped>
.tri { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.badge.st { display: flex; width: 100%; }
.sync { display: flex; flex-direction: column; font-size: 11px; color: var(--muted); line-height: 1.2; }
.sync b { font-weight: 600; }
@media (max-width: 767px) { .tri { grid-template-columns: minmax(0, 1fr); } }
</style>
