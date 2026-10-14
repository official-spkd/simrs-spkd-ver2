<script setup lang="ts">
const { db, poli, doctor, patient } = useDb()
const toast = useToast()
const route = useRoute()
const t = todayStr()
const q = route.query as Record<string, string>
const f = reactive({
  dari: /^\d{4}-\d{2}-\d{2}$/.test(q.dari || '') ? q.dari : t,
  sampai: /^\d{4}-\d{2}-\d{2}$/.test(q.sampai || '') ? q.sampai : t,
  poliId: '', doctorId: '', penjamin: '', kanal: '',
})
const dokterOpsi = computed(() => db.doctors.filter((d: any) => !f.poliId || d.poliId === f.poliId))
watch(() => f.poliId, () => { if (f.doctorId && !dokterOpsi.value.some((d: any) => d.id === f.doctorId)) f.doctorId = '' })
const reset = () => Object.assign(f, { dari: t, sampai: t, poliId: '', doctorId: '', penjamin: '', kanal: '' })

const rows = computed(() => {
  if (f.dari > f.sampai) return []
  return db.visits
    .filter((v: any) => v.tanggal >= f.dari && v.tanggal <= f.sampai && (!f.poliId || v.poliId === f.poliId) && (!f.doctorId || v.doctorId === f.doctorId) && (!f.penjamin || v.penjamin === f.penjamin) && (!f.kanal || v.kanal === f.kanal))
    .map((v: any) => {
      const p = patient(v.patientId)
      const baru = dateOf(p?.createdAt) === v.tanggal
      return { v, p, baru, poli: poli(v.poliId), dr: doctor(v.doctorId) }
    })
    .sort((a: any, b: any) => (a.v.jamDaftar < b.v.jamDaftar ? 1 : -1))
})
const salah = computed(() => f.dari > f.sampai)
const aktifRows = computed(() => rows.value.filter((r: any) => r.v.status !== 'dibatalkan'))
const ringkas = (keyFn: (r: any) => string, labelFn: (k: string) => string) => {
  const m: Record<string, { total: number; baru: number; lama: number; batal: number }> = {}
  rows.value.forEach((r: any) => {
    const k = keyFn(r)
    const x = (m[k] = m[k] || { total: 0, baru: 0, lama: 0, batal: 0 })
    if (r.v.status === 'dibatalkan') { x.batal++; return }
    x.total++
    r.baru ? x.baru++ : x.lama++
  })
  return Object.entries(m).map(([k, v]) => ({ nama: labelFn(k), ...v }))
}
const perPoli = computed(() => ringkas((r) => r.v.poliId, (k) => poli(k)?.nama || k))
const perDokter = computed(() => ringkas((r) => r.v.doctorId, (k) => doctor(k)?.nama || k))
const baruN = computed(() => aktifRows.value.filter((r: any) => r.baru).length)
const lamaN = computed(() => aktifRows.value.length - baruN.value)

const ekspor = () => {
  if (!rows.value.length) return toast.warn('Tidak ada data untuk diekspor')
  const head = ['No. Kunjungan', 'Tanggal', 'Jam daftar', 'No. RM', 'Pasien', 'Tipe pasien', 'Poli', 'Dokter', 'Penjamin', 'Kanal', 'Status']
  const body = rows.value.map((r: any) => [r.v.noKunjungan, r.v.tanggal, fmtJam(r.v.jamDaftar), r.p?.rm, r.p?.nama, r.baru ? 'Baru' : 'Lama', r.poli?.nama, r.dr?.nama, r.v.penjamin, r.v.kanal, r.v.status])
  downloadCsv(`laporan-kunjungan-${f.dari}_${f.sampai}.csv`, [head, ...body])
  toast.ok(`Berkas CSV diunduh (${rows.value.length} baris)`)
}
const cetak = () => window.print()
</script>

<template>
  <div>
    <PageHead code="MG-02" role="Management" title="Laporan Kunjungan & Pendaftaran" subtitle="Tabel kunjungan dengan ringkasan per poli/dokter. Ekspor Excel (CSV) atau PDF (cetak).">
      <template #actions>
        <button class="btn" @click="ekspor">Ekspor Excel (CSV)</button>
        <button class="btn" @click="cetak">Ekspor PDF (cetak)</button>
      </template>
    </PageHead>

    <div class="card no-print" style="margin-bottom: 16px">
      <div class="filters" style="margin-bottom: 0">
        <div class="field"><label for="f-dari">Dari</label><input id="f-dari" v-model="f.dari" type="date" class="input" :max="f.sampai" /></div>
        <div class="field"><label for="f-sampai">Sampai</label><input id="f-sampai" v-model="f.sampai" type="date" class="input" :min="f.dari" /></div>
        <div class="field"><label for="f-poli">Poli</label>
          <select id="f-poli" v-model="f.poliId" class="select"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
        </div>
        <div class="field"><label for="f-dr">Dokter</label>
          <select id="f-dr" v-model="f.doctorId" class="select"><option value="">Semua dokter</option><option v-for="d in dokterOpsi" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
        </div>
        <div class="field"><label for="f-pj">Penjamin</label>
          <select id="f-pj" v-model="f.penjamin" class="select"><option value="">Semua</option><option>Umum</option><option>BPJS</option><option>Asuransi</option></select>
        </div>
        <div class="field"><label for="f-kn">Kanal</label>
          <select id="f-kn" v-model="f.kanal" class="select"><option value="">Semua</option><option value="loket">Loket</option><option value="apm">APM</option><option value="reservasi">Reservasi</option></select>
        </div>
        <button class="btn" @click="reset">Atur ulang</button>
      </div>
      <p v-if="salah" class="err-text" style="margin-top: 8px">Tanggal awal tidak boleh setelah tanggal akhir.</p>
    </div>

    <div class="grid g4" style="margin-bottom: 16px">
      <div class="kpi"><small>Total kunjungan</small><b>{{ aktifRows.length }}</b><span>{{ rows.length - aktifRows.length }} dibatalkan</span></div>
      <div class="kpi"><small>Pasien baru</small><b>{{ baruN }}</b><span>daftar pertama kali pada hari kunjungan</span></div>
      <div class="kpi"><small>Pasien lama</small><b>{{ lamaN }}</b><span>sudah terdaftar sebelumnya</span></div>
      <div class="kpi"><small>Periode</small><b style="font-size: 16px">{{ fmtTgl(f.dari) }} - {{ fmtTgl(f.sampai) }}</b><span>filter aktif</span></div>
    </div>

    <div class="grid g2" style="margin-bottom: 16px">
      <div class="card">
        <h2>Ringkasan per poli</h2>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th>Poli</th><th class="right">Total</th><th class="right">Baru</th><th class="right">Lama</th><th class="right">Batal</th></tr></thead>
            <tbody>
              <tr v-for="r in perPoli" :key="r.nama"><td data-label="Poli">{{ r.nama }}</td><td class="right" data-label="Total">{{ r.total }}</td><td class="right" data-label="Baru">{{ r.baru }}</td><td class="right" data-label="Lama">{{ r.lama }}</td><td class="right" data-label="Batal">{{ r.batal }}</td></tr>
              <tr v-if="!perPoli.length"><td colspan="5" class="empty">Tidak ada data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <h2>Ringkasan per dokter</h2>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th>Dokter</th><th class="right">Total</th><th class="right">Baru</th><th class="right">Lama</th><th class="right">Batal</th></tr></thead>
            <tbody>
              <tr v-for="r in perDokter" :key="r.nama"><td data-label="Dokter">{{ r.nama }}</td><td class="right" data-label="Total">{{ r.total }}</td><td class="right" data-label="Baru">{{ r.baru }}</td><td class="right" data-label="Lama">{{ r.lama }}</td><td class="right" data-label="Batal">{{ r.batal }}</td></tr>
              <tr v-if="!perDokter.length"><td colspan="5" class="empty">Tidak ada data</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Daftar kunjungan ({{ rows.length }})</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>No. kunjungan</th><th>Tanggal</th><th>Pasien</th><th>Tipe</th><th>Poli</th><th>Dokter</th><th>Penjamin</th><th>Kanal</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r.v.id">
              <td data-label="No. kunjungan" class="mono">{{ r.v.noKunjungan }}</td>
              <td data-label="Tanggal">{{ fmtTgl(r.v.tanggal) }} {{ fmtJam(r.v.jamDaftar) }}</td>
              <td data-label="Pasien">{{ r.p?.nama }} <span class="muted small">RM {{ r.p?.rm }}</span></td>
              <td data-label="Tipe"><span class="badge" :class="r.baru ? 'b-teal' : 'b-mute'">{{ r.baru ? 'Baru' : 'Lama' }}</span></td>
              <td data-label="Poli">{{ r.poli?.nama }}</td>
              <td data-label="Dokter">{{ r.dr?.nama }}</td>
              <td data-label="Penjamin"><StatusBadge :value="r.v.penjamin" /></td>
              <td data-label="Kanal"><StatusBadge :value="r.v.kanal" /></td>
              <td data-label="Status"><StatusBadge :value="r.v.status" /></td>
            </tr>
            <tr v-if="!rows.length"><td colspan="9" class="empty">Tidak ada kunjungan pada filter ini</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
