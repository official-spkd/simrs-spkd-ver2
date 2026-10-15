<script setup lang="ts">
// KL-01 Worklist Poli
const { db, poli, doctor, patient, callPoli, recallPoli, skipPoli, startExam, taskBpjs } = useDb()
const { user } = useAuth()
const toast = useToast()
const route = useRoute()

// Akun dokter: antrean dari server (GET /api/v1/queues), dimuat ulang berkala.
// Panggil / mulai periksa / SOAP masih lokal karena backend belum punya endpoint status poli.
const { isDokter, tanggal, serverIds, syncErr, syncSkip, loading, sync, rows: semua, dokter, poliAktif } = useDokterQueue()

const tick = ref(Date.now())
let timer: any, syncTimer: any
onMounted(() => {
  timer = setInterval(() => (tick.value = Date.now()), 30000)
  if (isDokter.value) { sync(); syncTimer = setInterval(sync, 15000) }
})
onBeforeUnmount(() => { clearInterval(timer); clearInterval(syncTimer) })
watch(tanggal, () => { page.value = 1; sync() })

// filter (akun dokter: poli & dokter terkunci sesuai penugasan)
const poliId = ref('')
const doctorId = ref('')
const q = ref('')
const doctorOptions = computed(() => db.doctors.filter((d: any) => !poliId.value || d.poliId === poliId.value))
watch(poliId, () => { if (doctorId.value && !doctorOptions.value.some((d: any) => d.id === doctorId.value)) doctorId.value = '' })

const all = computed(() => {
  const s = q.value.trim().toLowerCase()
  return semua.value.filter((v: any) => {
    if (!isDokter.value && poliId.value && v.poliId !== poliId.value) return false
    if (!isDokter.value && doctorId.value && v.doctorId !== doctorId.value) return false
    if (!s) return true
    const p = patient(v.patientId)
    return p?.nama.toLowerCase().includes(s) || p?.rm.includes(s) || v.antreanPoli.nomor.toLowerCase().includes(s)
  })
})
const vitalSelesai = (v: any) => v.status === 'terdaftar' && v.antreanPoli.status === 'vital selesai'
const nMenunggu = computed(() => all.value.filter((v: any) => v.status === 'terdaftar' && !vitalSelesai(v)).length)
const nDilayani = computed(() => all.value.filter((v: any) => v.status === 'dilayani' || vitalSelesai(v)).length)
const nSelesai = computed(() => all.value.filter((v: any) => v.status === 'selesai').length)
const nLunas = computed(() => all.value.filter((v: any) => v.status === 'lunas').length)

// paginasi 6 baris seperti desain
// kunjungan yang sudah ditutup hilang dari antrean (alur MVP); bisa ditampilkan lagi lewat centang
const showDone = ref(false)
const tampil = computed(() => (showDone.value ? all.value : all.value.filter((v: any) => !['selesai', 'lunas'].includes(v.status))))
const PER = 6
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(tampil.value.length / PER)))
watch(tampil, () => { if (page.value > pages.value) page.value = pages.value })
const rows = computed(() => tampil.value.slice((page.value - 1) * PER, page.value * PER))

// pasien terpilih (panel bawah)
const selId = ref<string>(String(route.query.sel || ''))
const sel = computed(() => tampil.value.find((v: any) => v.id === selId.value) || tampil.value.find((v: any) => v.status === 'terdaftar') || tampil.value[0] || null)
const selPt = computed(() => (sel.value ? patient(sel.value.patientId) : null))

const tunggu = (v: any) => {
  void tick.value
  return menitAntara(v.jamDaftar, v.jamMulai || undefined)
}

const panggil = (v: any) => toast.attempt(() => callPoli(v.id), `Memanggil ${v.antreanPoli.nomor} — tampil di layar ruang tunggu`)
const ulang = (v: any) => toast.attempt(() => recallPoli(v.id), `Panggil ulang ${v.antreanPoli.nomor}`)
const lewati = (v: any) => toast.attempt(() => skipPoli(v.id), `${v.antreanPoli.nomor} dilewati`)
const mulai = (v: any) => {
  if (toast.attempt(() => startExam(v.id), `Pemeriksaan ${v.antreanPoli.nomor} dimulai`)) navigateTo('/klinis/' + v.id)
}
const subjudul = computed(() => (isDokter.value
  ? `Pasien yang ditugaskan ke ${poliAktif.value ? 'Poli ' + poliAktif.value.nama : 'poli Anda'} · ${dokter.value?.nama || user.value?.nama}`
  : 'Antrean pasien poli. Panggil pasien, lalu mulai periksa.'))
</script>

<template>
  <div>
    <PageHead code="KL-01" role="Dokter / Perawat" title="Worklist Poli" :subtitle="subjudul" />

    <div class="kl-filters">
      <input v-model="tanggal" class="input" type="date" aria-label="Tanggal pelayanan">
      <template v-if="isDokter">
        <select class="select" disabled aria-label="Poli"><option>{{ poliAktif?.nama || 'Poli penugasan' }}</option></select>
        <select class="select" disabled aria-label="Dokter"><option>{{ dokter?.nama || user?.nama }}</option></select>
      </template>
      <template v-else>
        <select v-model="poliId" class="select" aria-label="Poli">
          <option value="">Semua poli</option>
          <option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option>
        </select>
        <select v-model="doctorId" class="select" aria-label="Dokter">
          <option value="">Semua dokter</option>
          <option v-for="d in doctorOptions" :key="d.id" :value="d.id">{{ d.nama }}</option>
        </select>
      </template>
      <input v-model="q" class="input q" placeholder="⌕ Nama / RM pasien" aria-label="Cari nama atau RM pasien">
      <button class="btn" :disabled="loading" @click="sync">{{ loading ? 'Memuat…' : 'Segarkan' }}</button>
      <label class="check" style="align-items: center"><input v-model="showDone" type="checkbox"> Tampilkan yang selesai</label>
    </div>

    <p v-if="syncErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat antrean dari server: {{ syncErr }}</p>
    <p v-if="syncSkip" class="alert warn" role="alert" style="margin-bottom: 12px">{{ syncSkip }} pasien tidak ditampilkan karena poli/dokternya belum ada di master lokal. Muat ulang halaman.</p>

    <div class="grid g3" style="margin-bottom: 16px">
      <div class="kl-kpi"><small>Menunggu</small><b>{{ nMenunggu }}</b><span>Antrean menunggu / dipanggil</span></div>
      <div class="kl-kpi"><small>Sedang dilayani</small><b>{{ nDilayani }}</b><span>Vital selesai / diperiksa</span></div>
      <div class="kl-kpi"><small>Pelayanan selesai</small><b>{{ nSelesai + nLunas }}</b><span>{{ nSelesai }} selesai · {{ nLunas }} lunas</span></div>
    </div>

    <div class="panel">
      <h2>Antrean poli hari ini</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Antrean</th><th>Pasien / RM</th><th>Usia / JK</th><th>Penjamin</th><th>Daftar / tunggu</th><th>Alergi</th><th>Antrean poli</th><th>Kunjungan</th><th>Task ID BPJS · Demo</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="9">{{ isDokter && !serverIds && !syncErr ? 'Memuat antrean…' : 'Tidak ada pasien pada antrean ini.' }}</td></tr>
            <tr v-for="v in rows" :key="v.id" class="click" :class="{ sel: sel?.id === v.id }" tabindex="0" @click="selId = v.id" @dblclick="navigateTo('/klinis/' + v.id)" @keydown.enter="selId = v.id">
              <td data-label="Antrean">{{ v.antreanPoli.nomor }}</td>
              <td data-label="Pasien / RM">{{ patient(v.patientId).nama }}<div>{{ patient(v.patientId).rm }}</div></td>
              <td data-label="Usia / JK">{{ patient(v.patientId).tglLahir ? umur(patient(v.patientId).tglLahir) : '-' }} / {{ patient(v.patientId).jk || '-' }}</td>
              <td data-label="Penjamin"><span class="badge b-navy">{{ v.penjamin || '-' }}</span></td>
              <td data-label="Daftar / tunggu">{{ fmtJam(v.jamDaftar) }} / {{ ['selesai', 'lunas'].includes(v.status) ? '-' : tunggu(v) + ' mnt' }}</td>
              <td data-label="Alergi" :style="patient(v.patientId).alergi ? 'color:var(--err);font-weight:600' : ''">{{ patient(v.patientId).alergi || 'Tidak ada' }}</td>
              <td data-label="Antrean poli"><StatusBadge :value="statusAntreanPoli(v)" /></td>
              <td data-label="Kunjungan"><StatusBadge :value="v.status" /></td>
              <td data-label="Task ID BPJS"><span class="badge" :class="taskBpjs(v).cls">{{ taskBpjs(v).label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pager-kl" aria-label="Paginasi">
        Menampilkan {{ rows.length }} dari {{ tampil.length }} pasien ·
        <button v-for="n in pages" :key="n" :class="{ on: n === page }" :aria-current="n === page ? 'page' : undefined" @click="page = n">{{ n }}</button>
        · <button :disabled="page >= pages" @click="page++">Berikutnya ›</button>
      </div>
    </div>

    <div class="kl-cols half" style="margin-top: 16px">
      <div class="panel">
        <template v-if="sel && selPt">
          <h2>Pasien terpilih · {{ sel.antreanPoli.nomor }}</h2>
          <div style="font-size: 18px; font-weight: 600">{{ selPt.nama }} · RM {{ selPt.rm }}</div>
          <div><span class="badge b-teal">Antrean: {{ statusAntreanPoli(sel) }}</span></div>
          <div class="kl-actions">
            <template v-if="sel.status === 'terdaftar'">
              <button class="btn" @click="panggil(sel)">Panggil Pasien</button>
              <button class="btn btn-primary" @click="mulai(sel)">Mulai Periksa</button>
              <NuxtLink :to="'/klinis/' + sel.id + '?tab=vital'" class="btn">{{ sel.antreanPoli.status === 'vital selesai' ? 'Lihat vital' : 'Isi vital & pengkajian' }}</NuxtLink>
              <button class="btn" :disabled="sel.antreanPoli.status === 'dilewati'" @click="lewati(sel)">Lewati</button>
              <button class="btn" :disabled="!sel.jamPanggil" @click="ulang(sel)">Panggil ulang</button>
            </template>
            <NuxtLink v-else-if="sel.status === 'dilayani'" :to="'/klinis/' + sel.id" class="btn btn-primary">Lanjutkan di workspace</NuxtLink>
            <NuxtLink v-else :to="'/klinis/' + sel.id" class="btn">Lihat workspace</NuxtLink>
          </div>
          <p style="font-weight: 600">Penjamin {{ sel.penjamin }} · Task BPJS: {{ sel.penjamin === 'BPJS' ? taskBpjs(sel).label : 'Tidak berlaku' }}</p>
        </template>
        <template v-else>
          <h2>Pasien terpilih</h2>
          <p class="muted">Pilih pasien pada tabel antrean.</p>
        </template>
      </div>
      <div class="panel">
        <h2>Pelayanan bersama</h2>
        <p>Dokter dan perawat memakai satu role Dokter / Perawat. Pasien dibuka sesuai penugasan poli dan dokter.</p>
        <div class="guide">BPJS: Panggil Pasien → Task 4 · Mulai Tunggu Poli. Mulai Periksa → Task 5 · Mulai Layani Dokter. Non-BPJS: Tidak berlaku; aksi klinis tetap tersedia. Semua pencatatan task adalah demo.</div>
      </div>
    </div>
  </div>
</template>
