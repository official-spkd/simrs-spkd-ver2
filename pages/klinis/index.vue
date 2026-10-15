<script setup lang="ts">
// KL-01 Worklist Poli
const { db, poli, doctor, patient, poliQueue, callPoli, recallPoli, skipPoli, startExam } = useDb()
const { user } = useAuth()
const toast = useToast()

const poliId = ref<string>(user.value?.poliId || '')
const doctorId = ref<string>(user.value?.doctorId || '')
const tick = ref(Date.now())

// Akun dokter: antrean dari server (GET /api/v1/queues — hanya pasien dokter akun ini), dimuat ulang berkala.
// Panggil / mulai periksa / SOAP masih lokal karena backend belum punya endpoint status poli.
const isDokter = computed(() => user.value?.role === 'dokter')
const serverIds = ref<Set<string> | null>(null)
const syncErr = ref('')
const syncSkip = ref(0)
const sync = async () => {
  if (!isDokter.value) return
  try {
    const r = await useVisits().syncDokter()
    serverIds.value = new Set(r.rows.map((v: any) => v.id))
    syncSkip.value = r.skipped
    syncErr.value = ''
  } catch (e: any) {
    syncErr.value = e instanceof ApiError && e.status === 403 ? 'Akun ini belum terhubung ke data dokter. Hubungi IT.' : e.message
  }
}
let timer: any, syncTimer: any
onMounted(() => {
  timer = setInterval(() => (tick.value = Date.now()), 30000)
  if (isDokter.value) { sync(); syncTimer = setInterval(sync, 15000) }
})
onBeforeUnmount(() => { clearInterval(timer); clearInterval(syncTimer) })

const doctorOptions = computed(() => db.doctors.filter((d: any) => !poliId.value || d.poliId === poliId.value))
watch(poliId, () => {
  if (doctorId.value && !doctorOptions.value.some((d: any) => d.id === doctorId.value)) doctorId.value = ''
})

const gabungan = (v: any) => {
  if (v.status === 'selesai' || v.status === 'lunas') return 'selesai'
  if (v.status === 'dilayani') return v.antreanPoli.status === 'vital selesai' ? 'vital selesai' : 'diperiksa'
  return v.antreanPoli.status
}
const all = computed(() => (isDokter.value
  ? db.visits.filter((v: any) => serverIds.value?.has(v.id) && v.status !== 'dibatalkan')
  : poliQueue(poliId.value || null, doctorId.value || null)).slice().sort((a: any, b: any) => (a.antreanPoli.nomor > b.antreanPoli.nomor ? 1 : -1)))
const aktif = computed(() => all.value.filter((v: any) => !['selesai', 'lunas'].includes(v.status)))
const selesai = computed(() => all.value.filter((v: any) => ['selesai', 'lunas'].includes(v.status)))
const nMenunggu = computed(() => aktif.value.filter((v: any) => v.status === 'terdaftar').length)
const nDilayani = computed(() => aktif.value.filter((v: any) => v.status === 'dilayani').length)
const showDone = ref(false)
const rows = computed(() => (showDone.value ? all.value : aktif.value))

const tunggu = (v: any) => {
  void tick.value
  return menitAntara(v.jamDaftar, v.jamMulai || undefined)
}

const panggil = (v: any) => {
  if (toast.attempt(() => callPoli(v.id), `Memanggil ${v.antreanPoli.nomor} — tampil di layar ruang tunggu`)) { /* ok */ }
}
const ulang = (v: any) => toast.attempt(() => recallPoli(v.id), `Panggil ulang ${v.antreanPoli.nomor}`)
const lewati = (v: any) => toast.attempt(() => skipPoli(v.id), `${v.antreanPoli.nomor} dilewati`)
const mulai = (v: any) => {
  const r = toast.attempt(() => startExam(v.id), `Pemeriksaan ${v.antreanPoli.nomor} dimulai`)
  if (r) navigateTo('/klinis/' + v.id)
}
</script>

<template>
  <div>
    <PageHead code="KL-01" role="Dokter / Perawat" title="Worklist Poli" subtitle="Antrean pasien poli hari ini. Panggil pasien, lalu mulai periksa." :crumbs="['Klinis', 'Worklist poli']" />

    <div class="grid g3" style="margin-bottom:16px">
      <div class="kpi"><small>Menunggu</small><b>{{ nMenunggu }}</b><span>terdaftar, belum diperiksa</span></div>
      <div class="kpi"><small>Dilayani</small><b>{{ nDilayani }}</b><span>sedang diperiksa</span></div>
      <div class="kpi"><small>Selesai</small><b>{{ selesai.length }}</b><span>sudah ditutup kunjungannya</span></div>
    </div>

    <p v-if="syncErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat antrean dari server: {{ syncErr }}</p>
    <p v-if="syncSkip" class="alert warn" role="alert" style="margin-bottom: 12px">{{ syncSkip }} pasien tidak ditampilkan karena poli/dokternya belum ada di master lokal. Muat ulang halaman.</p>

    <div class="card">
      <div class="filters">
        <template v-if="!isDokter">
        <div class="field"><label for="f-poli">Poli</label>
          <select id="f-poli" v-model="poliId" class="select">
            <option value="">Semua poli</option>
            <option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option>
          </select>
        </div>
        <div class="field"><label for="f-dok">Dokter</label>
          <select id="f-dok" v-model="doctorId" class="select">
            <option value="">Semua dokter</option>
            <option v-for="d in doctorOptions" :key="d.id" :value="d.id">{{ d.nama }}</option>
          </select>
        </div>
        </template>
        <label class="check" style="min-height:40px;align-items:center"><input v-model="showDone" type="checkbox"> Tampilkan yang selesai</label>
      </div>

      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>No. antrean</th><th>Pasien</th><th>Umur / JK</th><th>Penjamin</th><th>Jam daftar</th><th>Tunggu</th><th>Status</th><th class="right">Aksi</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="8">{{ isDokter && !serverIds && !syncErr ? 'Memuat antrean…' : 'Tidak ada pasien pada antrean ini.' }}</td></tr>
            <tr v-for="v in rows" :key="v.id">
              <td data-label="No. antrean"><b>{{ v.antreanPoli.nomor }}</b></td>
              <td data-label="Pasien">
                <NuxtLink :to="'/klinis/' + v.id" class="bold">{{ patient(v.patientId).nama }}</NuxtLink>
                <span v-if="patient(v.patientId).alergi" class="alergi-tag" style="margin-left:6px" :title="'Alergi: ' + patient(v.patientId).alergi">Alergi</span>
                <div class="muted small">{{ patient(v.patientId).rm }} · {{ poli(v.poliId).nama }}</div>
              </td>
              <td data-label="Umur / JK">{{ patient(v.patientId).tglLahir ? umur(patient(v.patientId).tglLahir) + ' th' : '-' }} / {{ patient(v.patientId).jk || '-' }}</td>
              <td data-label="Penjamin"><StatusBadge v-if="v.penjamin" :value="v.penjamin" /><span v-else class="muted">-</span></td>
              <td data-label="Jam daftar">{{ fmtJam(v.jamDaftar) }}</td>
              <td data-label="Tunggu">{{ ['selesai', 'lunas'].includes(v.status) ? '-' : tunggu(v) + ' mnt' }}</td>
              <td data-label="Status"><StatusBadge :value="gabungan(v)" /></td>
              <td data-label="Aksi" class="right">
                <div class="row" style="justify-content:flex-end">
                  <template v-if="v.status === 'terdaftar'">
                    <button class="btn btn-sm" @click="panggil(v)">{{ v.antreanPoli.status === 'dipanggil' ? 'Panggil lagi' : 'Panggil' }}</button>
                    <button v-if="v.antreanPoli.status === 'dipanggil'" class="btn btn-sm" @click="ulang(v)">Panggil ulang</button>
                    <button v-if="v.antreanPoli.status !== 'dilewati'" class="btn btn-sm btn-danger" @click="lewati(v)">Lewati</button>
                    <button class="btn btn-sm btn-primary" @click="mulai(v)">Mulai periksa</button>
                  </template>
                  <template v-else-if="v.status === 'dilayani'">
                    <button class="btn btn-sm btn-primary" @click="navigateTo('/klinis/' + v.id)">Lanjutkan</button>
                  </template>
                  <template v-else>
                    <button class="btn btn-sm" @click="navigateTo('/klinis/' + v.id)">Lihat</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Pemanggilan pertama menandai poli mulai. Nomor yang dipanggil tampil di layar ruang tunggu (VWR-02).</p>
    </div>
  </div>
</template>
