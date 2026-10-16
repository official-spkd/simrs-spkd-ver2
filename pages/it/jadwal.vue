<script setup lang="ts">
import type { ApiPoli } from '~/composables/usePolis'
import type { ApiDoctor } from '~/composables/useDoctors'
import type { ApiSchedule, ApiSession } from '~/composables/useSchedules'
// IT-03 Master Jadwal & Kuota — langsung dari server (/api/v1/schedules, superadmin): template mingguan per dokter,
// sesi harian 30 hari (dihitung server dari template + cuti) dan cuti / dokter pengganti. Kuota satu sumber untuk loket / APM / reservasi.
const svc = useSchedules()
const toast = useToast()
const URUT = [1, 2, 3, 4, 5, 6, 0]
const t = todayStr()
const jam = (s?: string) => (s ? s.replace(':', '.') : '—')
const pendek = (nama?: string) => (nama || '').replace(/^(dr|drg)\.\s*/i, '').split(/[ ,]/)[0]

// ---- master poli & dokter (filter) ----
const polis = ref<ApiPoli[]>([])
const doctors = ref<ApiDoctor[]>([])
const loading = ref(false)
const loadErr = ref('')
const senin = (d: string) => addDays(d, -((new Date(d + 'T00:00:00').getDay() + 6) % 7))
const minggu = Array.from({ length: 5 }, (_, i) => addDays(senin(t), i * 7))
const fmtMinggu = (a: string) => {
  const b = addDays(a, 6)
  return `${a.slice(5, 7) === b.slice(5, 7) ? Number(a.slice(8)) : fmtTglPendek(a)}–${fmtTgl(b)}`
}
const selMinggu = ref(minggu[0])
const selPoli = ref('')
const selDoc = ref('')
const dokterOpsi = computed(() => doctors.value.filter((d) => !selPoli.value || d.poli?.id === selPoli.value))
watch(dokterOpsi, (l) => { if (!l.some((d) => d.id === selDoc.value)) selDoc.value = l[0]?.id || '' })
const docSel = computed(() => doctors.value.find((d) => d.id === selDoc.value))
const errMsg = (e: any) => e?.message || String(e)

// ---- template mingguan ----
const templates = ref<ApiSchedule[]>([])
const tpl = computed(() => URUT.map((h) => ({ hari: h, s: templates.value.find((x) => x.weekday === h) })))
const efektifMulai = computed(() => templates.value.map((x) => x.effective_date).sort()[0])

// ---- form edit template ----
const blank = () => ({ id: '', hari: 1, mulai: '08:00', selesai: '12:00', jkn: 20, nonJkn: 10, efektif: t, minQuota: 0 })
const f = reactive<any>(blank())
const edit = ref(false)
const saving = ref(false)
const buka = (s?: ApiSchedule, hari?: number) => {
  Object.assign(f, blank(), s
    ? { id: s.id, hari: s.weekday, mulai: s.start_time, selesai: s.end_time, jkn: s.jkn_quota, nonJkn: s.non_jkn_quota, efektif: s.effective_date > t ? s.effective_date : t, minQuota: s.min_quota }
    : hari != null ? { hari } : {})
  edit.value = true
}
const bukaBaru = () => {
  const kosong = URUT.find((h) => !tpl.value.find((x) => x.hari === h)?.s)
  if (kosong == null) return toast.warn('Semua hari sudah punya template. Gunakan Edit.')
  buka(undefined, kosong)
}
// Form selalu tampil: template pada hari ini, atau template pertama, atau form template baru.
const pilihAwal = () => {
  const s = templates.value.find((x) => x.weekday === new Date(t + 'T00:00:00').getDay()) || templates.value[0]
  s ? buka(s) : buka(undefined, URUT[0])
}
const total = computed(() => (Number(f.jkn) || 0) + (Number(f.nonJkn) || 0))
const terisiMin = computed(() => f.minQuota)
// Jam tampil "08.00" (Figma), dikirim "08:00".
const jamField = (k: 'mulai' | 'selesai') => computed({
  get: () => String(f[k] || '').replace(':', '.'),
  set: (v: string) => { f[k] = v.replace(/[.,]/, ':') },
})
const jamMulai = jamField('mulai')
const jamSelesai = jamField('selesai')
const jamOk = (v: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(v)
const pad = (v: string) => v.padStart(5, '0')
const simpan = async () => {
  if (!selDoc.value) return
  if (!jamOk(f.mulai) || !jamOk(f.selesai)) return toast.err('Format jam harus HH.MM, mis. 08.00')
  const body = { start_time: pad(f.mulai), end_time: pad(f.selesai), jkn_quota: Number(f.jkn) || 0, non_jkn_quota: Number(f.nonJkn) || 0, effective_date: f.efektif }
  saving.value = true
  try {
    const r = f.id ? await svc.update(f.id, body) : await svc.create(selDoc.value, Number(f.hari), body)
    toast.ok('Template disimpan · sesi 30 hari diperbarui')
    await muat()
    buka(templates.value.find((x) => x.id === r.id))
  } catch (e: any) { toast.err(errMsg(e)) } finally { saving.value = false }
}
const hapusTpl = async () => {
  const s = templates.value.find((x) => x.id === f.id)
  if (!s) return toast.warn('Pilih template yang akan dihapus')
  if (!confirm(`Hapus template ${hariNama(s.weekday)} ${s.start_time}–${s.end_time}? Hanya template tanpa pasien/reservasi yang dapat dihapus.`)) return
  try { await svc.remove(s.id); toast.ok('Template dihapus'); await muat(); pilihAwal() } catch (e: any) { toast.err(errMsg(e)) }
}

// ---- sesi harian & pengecualian (minggu terpilih) ----
const sesiRaw = ref<ApiSession[]>([])
const STATUS: Record<string, [string, string]> = { active: ['Aktif', 'b-ok'], completed: ['Selesai', 'b-mute'], leave: ['Cuti', 'b-warn'], substitute: ['Pengganti', 'b-navy'] }
const sesi = computed(() => sesiRaw.value.map((s: ApiSession) => {
  const [status, cls] = STATUS[s.status]
  const label = s.status === 'leave' ? `${pendek(s.doctor.name)} · Cuti` : s.status === 'substitute' ? `${s.doctor.name} · Pengganti` : `${pendek(s.doctor.name)} · ${jam(s.start_time)}–${jam(s.end_time)}`
  return { key: s.date + s.status, tanggal: s.date, label, kuota: s.total_quota, terisi: s.filled, sisa: s.remaining, status, cls, s }
}))
const selSesi = ref('')
const sesiAktif = computed(() => sesi.value.find((x) => x.key === selSesi.value) || null)
const pilihSesiAwal = () => { selSesi.value = sesi.value.find((x) => x.s.date === t && x.s.status === 'active')?.key || sesi.value[0]?.key || '' }
const editSesi = () => {
  if (!sesiAktif.value) return toast.warn('Pilih sesi pada tabel terlebih dahulu')
  const s = templates.value.find((x) => x.weekday === new Date(sesiAktif.value!.tanggal + 'T00:00:00').getDay())
  if (s) buka(s)
}
const batalCuti = async () => {
  const id = sesiAktif.value?.s.exception_id
  if (!id || !confirm('Batalkan pengecualian (cuti) ini?')) return
  try { await svc.removeException(id); toast.ok('Pengecualian dibatalkan'); await muatSesi() } catch (e: any) { toast.err(errMsg(e)) }
}

// ---- muat data ----
const muatSesi = async () => {
  const to = addDays(selMinggu.value, 6)
  const from = selMinggu.value < t ? t : selMinggu.value // hari yang sudah lewat tidak ditampilkan
  if (!selDoc.value || to < from) { sesiRaw.value = []; return }
  try { sesiRaw.value = await svc.sessions({ doctor_id: selDoc.value, from, to }) } catch (e: any) { sesiRaw.value = []; toast.err(errMsg(e)) }
  if (!sesi.value.some((x) => x.key === selSesi.value)) pilihSesiAwal()
}
const muat = async () => {
  if (!selDoc.value) { templates.value = []; sesiRaw.value = []; return }
  try { templates.value = await svc.list({ doctor_id: selDoc.value }) } catch (e: any) { templates.value = []; toast.err(errMsg(e)) }
  await muatSesi()
}
const muatMaster = async () => {
  loading.value = true
  loadErr.value = ''
  try {
    const [p, d] = await Promise.all([usePolis().all(), useDoctors().all({ is_active: true })])
    polis.value = p.filter((x) => x.is_active)
    doctors.value = d
    selDoc.value = dokterOpsi.value[0]?.id || ''
  } catch (e: any) { loadErr.value = errMsg(e) } finally { loading.value = false }
}
watch(selDoc, async () => { await muat(); pilihAwal() })
watch(selMinggu, muatSesi)
onMounted(muatMaster)

// ---- catat cuti / dokter pengganti ----
const showC = ref(false)
const modePengganti = ref(false)
const saveC = ref(false)
const c = reactive<any>({ doctorId: '', tanggal: '', penggantiId: '', alasan: '' })
const sesiCuti = ref<ApiSession | null>(null) // sesi dokter pada tanggal cuti (null = tidak praktik)
const penggantiOpsi = ref<ApiDoctor[]>([])
const bukaC = (pengganti = false) => {
  const tgl = sesiAktif.value && sesiAktif.value.tanggal >= t ? sesiAktif.value.tanggal : addDays(t, 1)
  Object.assign(c, { doctorId: selDoc.value, tanggal: tgl, penggantiId: '', alasan: '' })
  modePengganti.value = pengganti
  showC.value = true
}
// Sesi dokter dan kandidat pengganti (dokter lain yang punya template pada hari itu) dimuat dari server.
const muatCuti = async () => {
  sesiCuti.value = null
  penggantiOpsi.value = []
  if (!showC.value || !c.doctorId || !c.tanggal) return
  const tanggal = c.tanggal
  try {
    const [rows, tpls] = await Promise.all([
      svc.sessions({ doctor_id: c.doctorId, from: tanggal, to: tanggal }),
      svc.list({ weekday: new Date(tanggal + 'T00:00:00').getDay() }),
    ])
    if (tanggal !== c.tanggal) return
    sesiCuti.value = rows.find((r) => r.status === 'active') || null
    const ids = new Set(tpls.map((x) => x.doctor.id))
    const poliId = doctors.value.find((d) => d.id === c.doctorId)?.poli?.id // pengganti dari poli yang sama agar pasien tetap dilayani di poli itu
    penggantiOpsi.value = doctors.value.filter((d) => d.id !== c.doctorId && ids.has(d.id) && d.poli?.id === poliId)
  } catch (e: any) { toast.err(errMsg(e)) }
}
watch(() => [showC.value, c.doctorId, c.tanggal], muatCuti)
const simpanC = async () => {
  if ((modePengganti.value || !sesiCuti.value) && !c.penggantiId) return toast.err('Dokter pengganti wajib dipilih')
  saveC.value = true
  try {
    await svc.createException({ doctor_id: c.doctorId, date: c.tanggal, substitute_doctor_id: c.penggantiId, reason: c.alasan })
    showC.value = false
    toast.ok(c.penggantiId ? 'Cuti & dokter pengganti dicatat' : 'Cuti dicatat')
    await muatSesi()
  } catch (e: any) { toast.err(errMsg(e)) } finally { saveC.value = false }
}
</script>

<template>
  <div class="jadwal">
    <PageHead code="IT-03" role="IT" title="Master Jadwal & Kuota" subtitle="Template mingguan dokter · Sesi harian otomatis untuk 30 hari ke depan" />
    <div v-if="loadErr" class="guide err" style="margin-bottom: 16px">{{ loadErr }} · Halaman ini hanya untuk superadmin.</div>
    <div class="kl-filters" style="margin-bottom: 24px">
      <label class="sr-only" for="j-mg">Minggu</label>
      <select id="j-mg" v-model="selMinggu" class="select"><option v-for="m in minggu" :key="m" :value="m">{{ fmtMinggu(m) }}</option></select>
      <label class="sr-only" for="j-poli">Poli</label>
      <select id="j-poli" v-model="selPoli" class="select"><option value="">Semua poli</option><option v-for="p in polis" :key="p.id" :value="p.id">{{ p.name }}</option></select>
      <label class="sr-only" for="j-dok">Dokter</label>
      <select id="j-dok" v-model="selDoc" class="select"><option v-for="d in dokterOpsi" :key="d.id" :value="d.id">{{ d.name }}</option></select>
      <button class="btn" :disabled="!selDoc" @click="bukaBaru">+ Template</button>
      <button class="btn" :disabled="!selDoc" @click="bukaC(false)">Catat cuti</button>
      <button class="btn" :disabled="!selDoc" @click="bukaC(true)">Dokter pengganti</button>
    </div>

    <div class="kl-cols">
      <div class="col">
        <div class="panel">
          <h2>Template mingguan · {{ docSel?.name || '-' }}</h2>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Hari</th><th>Mulai</th><th>Selesai</th><th>Total</th><th>JKN</th><th>Non-JKN</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="r in tpl" :key="r.hari" :class="{ sel: f.id && r.s?.id === f.id }">
                  <td data-label="Hari">{{ hariNama(r.hari) }}</td>
                  <td data-label="Mulai">{{ jam(r.s?.start_time) }}</td>
                  <td data-label="Selesai">{{ jam(r.s?.end_time) }}</td>
                  <td data-label="Total">{{ r.s?.total_quota ?? 0 }}</td>
                  <td data-label="JKN">{{ r.s?.jkn_quota ?? 0 }}</td>
                  <td data-label="Non-JKN">{{ r.s?.non_jkn_quota ?? 0 }}</td>
                  <td data-label="Aksi"><button v-if="r.s" class="link" @click="buka(r.s)">Edit</button><button v-else class="link" :title="'Tambah template ' + hariNama(r.hari)" @click="buka(undefined, r.hari)">Libur</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="muted">Template aktif · Total = JKN + Non-JKN{{ efektifMulai ? ' · Berlaku mulai ' + fmtTglPanjang(efektifMulai).split(', ')[1] : '' }}.</p>
      </div>

      <div class="panel">
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
              <tr v-if="!sesi.length"><td colspan="6" class="empty">{{ loading ? 'Memuat…' : 'Tidak ada sesi praktik pada minggu ini.' }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="kl-actions">
          <button class="btn" @click="bukaC(false)">Tambah pengecualian</button>
          <button class="btn" :disabled="!sesiAktif" @click="editSesi">Edit sesi</button>
          <button v-if="sesiAktif?.s.exception_id" class="btn" @click="batalCuti">Batalkan pengecualian</button>
          <button class="btn" :disabled="!f.id" @click="hapusTpl">Hapus draf template</button>
        </div>
      </div>
      </div>
      <div class="col">
        <div class="panel">
          <h2>{{ f.id ? 'Edit template' : 'Tambah template' }} · {{ hariNama(Number(f.hari)) }}</h2>
          <div class="field"><label class="req" for="t-dok">Dokter / poli</label><input id="t-dok" class="input" :value="`${docSel?.name || '-'} / ${docSel?.poli?.prefix_code || '-'}`" disabled /></div>
          <div class="field"><label class="req" for="t-hari">Hari</label>
            <select id="t-hari" v-model.number="f.hari" class="select" :disabled="!!f.id"><option v-for="h in URUT" :key="h" :value="h" :disabled="!f.id && !!tpl.find((x) => x.hari === h)?.s">{{ hariNama(h) }}</option></select>
          </div>
          <div class="kl-cols half">
            <div class="field"><label class="req" for="t-mulai">Mulai</label><input id="t-mulai" v-model="jamMulai" type="text" inputmode="numeric" maxlength="5" placeholder="08.00" class="input" /></div>
            <div class="field"><label class="req" for="t-sel">Selesai</label><input id="t-sel" v-model="jamSelesai" type="text" inputmode="numeric" maxlength="5" placeholder="12.00" class="input" /></div>
          </div>
          <div class="field"><label class="req" for="t-tot">Total kuota</label><input id="t-tot" class="input" :value="total" disabled /></div>
          <div class="kl-cols half">
            <div class="field"><label for="t-jkn">JKN</label><input id="t-jkn" v-model.number="f.jkn" type="number" min="0" class="input" /></div>
            <div class="field"><label for="t-nj">Non-JKN</label><input id="t-nj" v-model.number="f.nonJkn" type="number" min="0" class="input" /></div>
          </div>
          <div class="field"><label class="req" for="t-ef">Tanggal efektif</label><div class="tgl"><input class="input" :value="fmtTglPanjang(f.efektif).split(', ')[1]" readonly tabindex="-1" aria-hidden="true" /><input id="t-ef" v-model="f.efektif" type="date" class="tgl-pick" :min="t" @click="($event.target as HTMLInputElement).showPicker?.()" /></div></div>
          <div><span class="badge" :class="total < terisiMin ? 'b-err' : 'b-warn'">{{ terisiMin }} terisi · Minimal kuota {{ terisiMin }}</span></div>
          <div class="guide" :class="{ err: total < terisiMin }">Kuota tidak boleh lebih kecil dari jumlah terisi. Perubahan tidak membatalkan reservasi yang sudah ada.</div>
          <div class="kl-actions">
            <button class="btn btn-primary" :disabled="saving || !selDoc" @click="simpan">Simpan template</button>
            <button class="btn" @click="pilihAwal">Batal</button>
          </div>
      </div>
        <div class="guide">Loket, APM, dan Reservasi berbagi kuota secara atomik. Sesi 30 hari dibuat otomatis; cuti dan dokter pengganti tercatat audit.</div>
      </div>
    </div>

    <AppModal v-model="showC" :title="modePengganti ? 'Dokter pengganti' : 'Catat cuti / pengecualian'">
      <div class="form-grid">
        <div class="field"><label class="req" for="c-dok">Dokter</label>
          <select id="c-dok" v-model="c.doctorId" class="select"><option v-for="d in doctors" :key="d.id" :value="d.id">{{ d.name }}</option></select>
        </div>
        <div class="field"><label class="req" for="c-tgl">Tanggal</label><input id="c-tgl" v-model="c.tanggal" type="date" class="input" :min="t" /></div>
        <div class="field full"><label :class="{ req: modePengganti || !sesiCuti || sesiCuti.filled > 0 }" for="c-pg">Dokter pengganti</label>
          <select id="c-pg" v-model="c.penggantiId" class="select"><option value="">Tanpa pengganti (sesi ditutup)</option><option v-for="d in penggantiOpsi" :key="d.id" :value="d.id">{{ d.name }}</option></select>
          <span v-if="!sesiCuti" class="hint">Dokter tidak punya jadwal pada tanggal ini. Pilih dokter pengganti agar poli tetap punya dokter hari itu.</span>
          <span v-else-if="sesiCuti.filled" class="hint">Sudah ada {{ sesiCuti.filled }} pasien/reservasi: wajib pilih dokter pengganti.</span>
          <span v-else-if="!penggantiOpsi.length" class="hint">Tidak ada dokter lain yang berpraktik pada tanggal ini.</span>
        </div>
        <div class="field full"><label class="req" for="c-al">Alasan</label><input id="c-al" v-model="c.alasan" class="input" maxlength="200" placeholder="mis. Cuti tahunan" /></div>
      </div>
      <template #footer><button class="btn" @click="showC = false">Batal</button><button class="btn btn-primary" :disabled="saveC" @click="simpanC">Simpan</button></template>
    </AppModal>
  </div>
</template>

<style scoped>
/* Token Figma IT-03 — dibatasi pada halaman ini agar halaman lain tidak berubah */
.jadwal {
  --line: #dfe7eb; --text: #173348; --muted: #647887; --navy: #06345d;
  --teal: #008d96; --teal-d: #00747c; --teal-l: #eaf6f5;
  --ok: #23734e; --ok-bg: #eaf5ee; --warn: #946017; --warn-bg: #fff5df;
}
.jadwal :deep(.page-head .code) { font-size: 12px; letter-spacing: 0; text-transform: none; }
.jadwal :deep(.page-head h1) { font-weight: 600; }
.jadwal :deep(.page-head p) { font-size: 14px; }
.jadwal .btn { min-height: 40px; font-size: 13px; }
.jadwal .field { gap: 8px; }
.jadwal .field > label { color: var(--text); }
.jadwal .field .req::after { color: inherit; }
.jadwal .select { appearance: none; padding-right: 28px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0h8L4 5z' fill='%23173348'/%3E%3C/svg%3E") no-repeat right 12px center; }
.jadwal .select:disabled { background-image: none; }
.jadwal .kl-filters .select { min-height: 40px; padding: 10px 12px; font-size: 13px; font-weight: 600; }
.jadwal .input:disabled, .jadwal .select:disabled { background: #fff; color: var(--text); opacity: 1; -webkit-text-fill-color: var(--text); }
.jadwal .input, .jadwal .select { min-height: 44px; padding: 12px; font-size: 14px; border-color: var(--line); color: var(--text); }
.jadwal .tbl th { background: #edf3f9; color: var(--muted); font-size: 12px; padding: 12px; }
.jadwal .tbl td { padding: 16px 12px; border-bottom-color: var(--line); color: var(--text); }
.jadwal .tbl tbody tr:nth-child(even) td { background: #fafcfd; }
.jadwal .tbl tbody tr.sel td { background: var(--teal-l); }
.jadwal .b-navy { background: #edf3f9; }
.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.badge.st { display: inline-flex; }
.tgl { position: relative; }
.tgl-pick { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
</style>
