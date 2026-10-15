<script setup lang="ts">
// FO-01 Worklist Pendaftaran
const { db, poli, patient, checkInReservation } = useDb()
const toast = useToast()

const q = ref('')
const searchOpen = ref(false)
const searchQ = ref('')
const openSearch = () => { searchQ.value = q.value.trim(); searchOpen.value = true }

// antrean loket — langsung dari server (/api/v1/counters); loket terpilih sama dengan di FO-07
const { lokets, loketId, loket, aktif, tertinggal, menunggu, log, poll, next, skip, complete } = useCounters()
// tiket loket hari ini per kunjungan (tiket dibuat server saat kunjungan didaftarkan, terhubung lewat visit_id)
const tiketOf = computed(() => new Map([...menunggu.value, ...log.value].map((t: any) => [t.visitId, t])))
const loketErr = poll()
const loketBusy = ref(false)
const runLoket = async (fn: () => Promise<any>, okMsg: (t: any) => string) => {
  loketBusy.value = true
  try { toast.ok(okMsg(await fn())) } catch (e: any) { toast.err(e.message) } finally { loketBusy.value = false }
}
const panggil = () => runLoket(next, (t) => `Memanggil ${t.nomor} ke ${loket.value?.nama}`)
const lewati = () => runLoket(skip, () => 'Nomor dilewati')
const bebaskan = () => runLoket(tertinggal.value?.raw === 'CALLING' ? skip : complete, (t) => `${t.nomor} (${fmtTgl(t.tanggal)}) ditutup, loket siap memanggil`)

// tabel kunjungan — langsung dari server (GET /api/v1/visits); filter & halaman diproses server
const visitSvc = useVisits()
const fTanggal = ref(todayStr())
const fPoli = ref('')
const fStatus = ref('')
const page = ref(1)
const PER = 10
const rows = ref<any[]>([])
const total = ref(0)
const pages = ref(1)
const syncing = ref(false)
const syncErr = ref('')
let seq = 0
const sync = async () => {
  const my = ++seq
  syncing.value = true
  syncErr.value = ''
  try {
    const r = await visitSvc.listView({ date: fTanggal.value, poli: fPoli.value, status: fStatus.value, page: page.value, limit: PER })
    if (my !== seq) return
    rows.value = r.rows
    total.value = r.pagination?.total_items ?? r.rows.length
    pages.value = Math.max(1, r.pagination?.total_pages ?? 1)
  } catch (e: any) {
    if (my !== seq) return
    rows.value = []
    total.value = 0
    syncErr.value = e.message
  } finally {
    if (my === seq) syncing.value = false
  }
}
onMounted(sync)
watch([fTanggal, fPoli, fStatus], () => (page.value === 1 ? sync() : (page.value = 1)))
watch(page, sync)
const judulTanggal = computed(() => (fTanggal.value === todayStr() ? 'Kunjungan hari ini' : 'Kunjungan ' + fmtTgl(fTanggal.value)))

const reservasi = computed(() => db.reservations.filter((r: any) => r.status === 'booked' && r.tanggal === todayStr()))
const checkIn = (r: any) => {
  const v = toast.attempt(() => checkInReservation(r.id))
  if (v && v !== true) toast.ok(`Check-in berhasil. Nomor antrean ${v.antreanPoli.nomor}`)
}

const detail = ref<any>(null)
const detailOpen = ref(false)
const openDetail = (v: any) => { detail.value = v; detailOpen.value = true }
const detailPt = computed(() => (detail.value?.patientId ? patient(detail.value.patientId) : null))
</script>

<template>
  <div>
    <PageHead code="FO-01" role="Front Office" title="Worklist Pendaftaran" subtitle="Cari pasien, panggil antrean loket, dan pantau kunjungan hari ini.">
      <template #actions>
        <NuxtLink to="/pasien/baru" class="btn btn-primary"><AppIcon name="plus" /> Pasien Baru</NuxtLink>
      </template>
    </PageHead>

    <form class="card row" style="flex-wrap: nowrap; margin-bottom: 16px" role="search" @submit.prevent="openSearch">
      <input v-model="q" class="input" style="min-height: 52px; font-size: 16px" placeholder="Cari NIK / No. BPJS / No. RM / Nama" inputmode="search" aria-label="Cari pasien" />
      <button class="btn btn-primary btn-lg" type="submit"><AppIcon name="search" /> Cari</button>
    </form>

    <div class="split">
      <div class="stack">
        <div class="card">
          <div class="row between">
            <h2 style="margin: 0">Antrean loket</h2>
            <select v-if="lokets.length > 1" v-model="loketId" class="select" style="width: auto; min-height: 32px" aria-label="Pilih loket">
              <option v-for="l in lokets" :key="l.id" :value="l.id" :disabled="!l.aktif">{{ l.nama }}{{ l.aktif ? '' : ' (nonaktif)' }}</option>
            </select>
          </div>
          <p v-if="loketErr" class="alert err small" role="alert" style="margin-top: 8px">{{ loketErr }}</p>
          <div class="muted small" style="margin-top: 6px">{{ loket?.nama || 'Loket' }} · {{ !aktif ? 'belum memanggil nomor' : aktif.raw === 'SERVING' ? 'sedang dilayani' : 'sedang dipanggil' }}</div>
          <div class="bignum">{{ aktif ? aktif.nomor : '-' }}</div>
          <p v-if="!aktif && !tertinggal && menunggu.length" class="muted small" style="margin: -4px 0 10px">Tekan <b>Panggil berikutnya</b> untuk memanggil <b class="mono">{{ menunggu[0].nomor }}</b>.</p>
          <div v-if="aktif" class="row" style="margin-bottom: 8px"><StatusBadge :value="aktif.status" /><span class="muted small">diambil {{ fmtJam(aktif.jam) }}<template v-if="aktif.nama"> · {{ aktif.nama }}</template></span></div>
          <div v-if="tertinggal" class="alert warn small" role="alert" style="margin-bottom: 10px">
            Nomor <b class="mono">{{ tertinggal.nomor }}</b> dari {{ fmtTgl(tertinggal.tanggal) }} masih tertahan di loket ini.
            <button class="btn btn-sm" style="margin-top: 6px" :disabled="loketBusy" @click="bebaskan">{{ tertinggal.raw === 'CALLING' ? 'Lewati nomor lama' : 'Selesaikan nomor lama' }}</button>
          </div>
          <div class="muted" style="margin-bottom: 14px">Sisa antrean hari ini: <b>{{ menunggu.length }}</b> menunggu</div>
          <div class="row">
            <button class="btn btn-primary" style="flex: 1" :disabled="loketBusy || !loket?.aktif || !!aktif || !!tertinggal" :title="aktif || tertinggal ? 'Selesaikan atau lewati nomor saat ini dulu' : ''" @click="panggil">Panggil berikutnya</button>
            <button class="btn" :disabled="loketBusy || aktif?.raw !== 'CALLING'" @click="lewati">Lewati</button>
          </div>
          <NuxtLink to="/fo/antrean" class="small" style="display: inline-block; margin-top: 12px">Buka layar pemanggilan penuh</NuxtLink>
          <ul v-if="menunggu.length" style="list-style: none; padding: 0; margin: 12px 0 0">
            <li v-for="t in menunggu.slice(0, 4)" :key="t.id" class="row between" style="padding: 6px 0; border-top: 1px solid var(--line)">
              <b class="mono">{{ t.nomor }}</b><span><span class="small">{{ t.poli }}</span> <span class="muted small">{{ fmtJam(t.jam) }}</span></span>
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="row between"><h2 style="margin: 0">Reservasi menunggu check-in</h2><NuxtLink to="/fo/reservasi" class="small">Semua</NuxtLink></div>
          <p v-if="!reservasi.length" class="muted" style="margin-top: 10px">Tidak ada reservasi hari ini yang menunggu check-in.</p>
          <div v-for="r in reservasi" :key="r.id" style="padding: 10px 0; border-top: 1px solid var(--line); margin-top: 10px">
            <div class="bold">{{ patient(r.patientId)?.nama }}</div>
            <div class="muted small">{{ r.kode }} · {{ poli(r.poliId)?.nama }} · {{ r.jam }}</div>
            <button class="btn btn-sm btn-primary" style="margin-top: 8px" @click="checkIn(r)">Check-in</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="row between" style="margin-bottom: 12px">
          <h2 style="margin: 0">{{ judulTanggal }}</h2>
          <button class="btn btn-sm" :disabled="syncing" @click="sync">{{ syncing ? 'Memuat…' : 'Muat ulang' }}</button>
        </div>
        <p v-if="syncErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat kunjungan dari server: {{ syncErr }}</p>
        <div class="filters">
          <div class="field">
            <label for="f-tgl" class="small">Tanggal</label>
            <input id="f-tgl" v-model="fTanggal" type="date" class="input" />
          </div>
          <div class="field">
            <label for="f-poli" class="small">Poli</label>
            <select id="f-poli" v-model="fPoli" class="select">
              <option value="">Semua poli</option>
              <option v-for="p in db.polis.filter((x: any) => x.serverId)" :key="p.id" :value="p.serverId">{{ p.nama }}</option>
            </select>
          </div>
          <div class="field">
            <label for="f-status" class="small">Status kunjungan</label>
            <select id="f-status" v-model="fStatus" class="select">
              <option value="">Semua status</option>
              <option v-for="st in ['terdaftar', 'dilayani', 'selesai', 'lunas', 'dibatalkan']" :key="st" :value="st">{{ st }}</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead>
              <tr><th>Antrean</th><th>RM</th><th>Nama</th><th>Poli / Dokter</th><th>Penjamin</th><th>Status</th><th>Antrean poli</th><th>Satu Sehat</th><th /></tr>
            </thead>
            <tbody>
              <tr v-for="v in rows" :key="v.id" class="click" @click="openDetail(v)">
                <td data-label="Antrean"><b class="mono">{{ tiketOf.get(v.id)?.nomor || '-' }}</b><div class="muted small mono">poli {{ v.nomorPoli }}</div></td>
                <td data-label="RM" class="mono">{{ v.rm }}</td>
                <td data-label="Nama" class="bold">{{ v.nama }}</td>
                <td data-label="Poli">{{ v.poliNama }}<span v-if="!v.diMaster" class="badge b-warn" style="margin-left: 6px">di luar master</span><div class="muted small">{{ v.dokterNama }}</div></td>
                <td data-label="Penjamin"><StatusBadge :value="v.penjamin" /></td>
                <td data-label="Status"><StatusBadge :value="v.status" /></td>
                <td data-label="Antrean poli"><StatusBadge :value="v.antre" /></td>
                <td data-label="Satu Sehat"><StatusBadge :value="v.satuSehat" /></td>
                <td data-label="">
                  <div class="row" style="flex-wrap: nowrap; justify-content: flex-end" @click.stop>
                    <button class="btn btn-sm" @click="openDetail(v)">Detail</button>
                  </div>
                </td>
              </tr>
              <tr v-if="syncing && !rows.length"><td colspan="9" class="empty">Memuat kunjungan dari server…</td></tr>
              <tr v-else-if="!rows.length && !syncErr"><td colspan="9" class="empty">Belum ada kunjungan yang cocok.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span>{{ total }} kunjungan · halaman {{ page }} / {{ pages }}</span>
          <span><button :disabled="page <= 1 || syncing" @click="page--">Sebelumnya</button><button :disabled="page >= pages || syncing" @click="page++">Berikutnya</button></span>
        </div>
        <p class="hint">Data langsung dari server. Pembatalan kunjungan belum tersedia karena backend belum punya endpoint ubah status.</p>
      </div>
    </div>

    <PatientSearchModal v-model="searchOpen" :initial-query="searchQ" />

    <AppModal v-model="detailOpen" title="Detail kunjungan">
      <template v-if="detail">
        <PatientBanner v-if="detailPt" :patient="detailPt" />
        <dl class="kv">
          <dt>Pasien</dt><dd>{{ detail.nama }} · {{ detail.rm }}</dd>
          <dt>Tanggal</dt><dd>{{ fmtTgl(detail.tanggal) }}</dd>
          <template v-if="tiketOf.get(detail.id)"><dt>Antrean loket</dt><dd><span class="mono">{{ tiketOf.get(detail.id).nomor }}</span> <StatusBadge :value="tiketOf.get(detail.id).status" /></dd></template>
          <dt>Antrean poli</dt><dd><span class="mono">{{ detail.nomorPoli }}</span> <StatusBadge :value="detail.antre" /></dd>
          <dt>Status kunjungan</dt><dd><StatusBadge :value="detail.status" /></dd>
          <dt>Poli / dokter</dt><dd>{{ detail.poliNama }} · {{ detail.dokterNama }}</dd>
          <dt>Jenis</dt><dd>{{ detail.tipe }}</dd>
          <dt>Penjamin</dt><dd><StatusBadge :value="detail.penjamin" /></dd>
          <template v-if="detail.bpjs"><dt>BPJS</dt><dd class="mono">{{ detail.bpjs }}<template v-if="detail.noRujukan"> · rujukan {{ detail.noRujukan }}</template><template v-if="detail.noKontrol"> · kontrol {{ detail.noKontrol }}</template></dd></template>
          <template v-if="detail.asuransi"><dt>Asuransi</dt><dd>{{ detail.asuransi }} · {{ detail.noPolis }} · plafon {{ fmtRp(detail.plafon) }}</dd></template>
          <dt>Keluhan</dt><dd>{{ detail.keluhan || '-' }}</dd>
          <dt>Penanggung jawab</dt><dd>{{ detail.pj || '-' }}</dd>
          <dt>Alergi</dt><dd>{{ detail.alergi || '-' }}</dd>
          <dt>Dokumen</dt><dd>{{ detail.dokumen || '-' }}</dd>
          <dt>Didaftarkan</dt><dd>{{ fmtWaktu(detail.dibuat) }}</dd>
          <dt>Satu Sehat</dt><dd><StatusBadge :value="detail.satuSehat" /></dd>
        </dl>
      </template>
      <template #footer>
        <button class="btn" @click="detailOpen = false">Tutup</button>
        <NuxtLink v-if="detail?.patientId" :to="'/pasien/' + detail.patientId" class="btn btn-primary" @click="detailOpen = false">Buka data pasien</NuxtLink>
      </template>
    </AppModal>
  </div>
</template>
