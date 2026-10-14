<script setup lang="ts">
// FO-01 Worklist Pendaftaran
const { db, poli, doctor, patient, loketAktif, loketMenunggu, callNextLoket, skipLoket, checkInReservation } = useDb()
const toast = useToast()

const LOKET = 2
const q = ref('')
const searchOpen = ref(false)
const searchQ = ref('')
const openSearch = () => { searchQ.value = q.value.trim(); searchOpen.value = true }

const aktif = computed(() => loketAktif(LOKET))
const menunggu = computed(() => loketMenunggu().slice().sort((a: any, b: any) => (a.jam > b.jam ? 1 : -1)))
const panggil = () => {
  const tk = toast.attempt(() => callNextLoket(LOKET))
  if (tk && tk !== true) toast.ok(`Memanggil ${tk.nomor} ke Loket ${LOKET}`)
}
const lewati = () => toast.attempt(() => skipLoket(LOKET), 'Nomor dilewati')

// tabel kunjungan hari ini
const fPoli = ref('')
const fStatus = ref('')
const page = ref(1)
const PER = 8
const rows = computed(() =>
  db.visits
    .filter((v: any) => v.tanggal === todayStr() && (!fPoli.value || v.poliId === fPoli.value) && (!fStatus.value || v.status === fStatus.value))
    .slice()
    .sort((a: any, b: any) => (a.jamDaftar > b.jamDaftar ? -1 : 1)),
)
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)))
const pageRows = computed(() => rows.value.slice((page.value - 1) * PER, page.value * PER))
watch([fPoli, fStatus], () => (page.value = 1))
watch(pages, (n) => { if (page.value > n) page.value = n })

const reservasi = computed(() => db.reservations.filter((r: any) => r.status === 'booked' && r.tanggal === todayStr()))
const checkIn = (r: any) => {
  const v = toast.attempt(() => checkInReservation(r.id))
  if (v && v !== true) toast.ok(`Check-in berhasil. Nomor antrean ${v.antreanPoli.nomor}`)
}

const detail = ref<any>(null)
const detailOpen = ref(false)
const openDetail = (v: any) => { detail.value = v; detailOpen.value = true }
const cancelOpen = ref(false)
const askCancel = () => { detailOpen.value = false; cancelOpen.value = true }
const canCancel = (v: any) => v && v.status === 'terdaftar' && ['menunggu', 'dipanggil'].includes(v.antreanPoli.status)
const detailPt = computed(() => (detail.value ? patient(detail.value.patientId) : null))
const lastCancelled = () => { detail.value = null }
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
          <h2>Antrean loket</h2>
          <div class="muted small">Loket {{ LOKET }} · sedang dipanggil</div>
          <div class="bignum">{{ aktif ? aktif.nomor : '-' }}</div>
          <div v-if="aktif" class="row" style="margin-bottom: 8px"><StatusBadge :value="aktif.kanal" /><span class="muted small">diambil {{ fmtJam(aktif.jam) }}</span></div>
          <div class="muted" style="margin-bottom: 14px">Sisa antrean: <b>{{ menunggu.length }}</b> menunggu</div>
          <div class="row">
            <button class="btn btn-primary" style="flex: 1" @click="panggil">Panggil berikutnya</button>
            <button class="btn" :disabled="!aktif" @click="lewati">Lewati</button>
          </div>
          <NuxtLink to="/fo/antrean" class="small" style="display: inline-block; margin-top: 12px">Buka layar pemanggilan penuh</NuxtLink>
          <ul v-if="menunggu.length" style="list-style: none; padding: 0; margin: 12px 0 0">
            <li v-for="t in menunggu.slice(0, 4)" :key="t.id" class="row between" style="padding: 6px 0; border-top: 1px solid var(--line)">
              <b class="mono">{{ t.nomor }}</b><span><StatusBadge :value="t.kanal" /> <span class="muted small">{{ fmtJam(t.jam) }}</span></span>
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
          <h2 style="margin: 0">Kunjungan hari ini</h2>
          <span class="muted small">{{ fmtTglPanjang() }}</span>
        </div>
        <div class="filters">
          <div class="field">
            <label for="f-poli" class="small">Poli</label>
            <select id="f-poli" v-model="fPoli" class="select">
              <option value="">Semua poli</option>
              <option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option>
            </select>
          </div>
          <div class="field">
            <label for="f-status" class="small">Status kunjungan</label>
            <select id="f-status" v-model="fStatus" class="select">
              <option value="">Semua status</option>
              <option v-for="s in ['terdaftar', 'dilayani', 'selesai', 'lunas', 'dibatalkan']" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead>
              <tr><th>Antrean</th><th>RM</th><th>Nama</th><th>Poli / Dokter</th><th>Penjamin</th><th>Status</th><th>Antrean poli</th><th>Satu Sehat</th><th /></tr>
            </thead>
            <tbody>
              <tr v-for="v in pageRows" :key="v.id" class="click" @click="openDetail(v)">
                <td data-label="Antrean" class="mono bold">{{ v.antreanPoli.nomor }}</td>
                <td data-label="RM" class="mono">{{ patient(v.patientId)?.rm }}</td>
                <td data-label="Nama" class="bold">{{ patient(v.patientId)?.nama }}</td>
                <td data-label="Poli">{{ poli(v.poliId)?.nama }}<div class="muted small">{{ doctor(v.doctorId)?.nama }}</div></td>
                <td data-label="Penjamin"><StatusBadge :value="v.penjamin" /></td>
                <td data-label="Status"><StatusBadge :value="v.status" /></td>
                <td data-label="Antrean poli"><StatusBadge :value="v.antreanPoli.status" /></td>
                <td data-label="Satu Sehat"><StatusBadge :value="v.satuSehat" /></td>
                <td data-label="">
                  <div class="row" style="flex-wrap: nowrap; justify-content: flex-end" @click.stop>
                    <button class="btn btn-sm" @click="openDetail(v)">Detail</button>
                    <button v-if="canCancel(v)" class="btn btn-sm btn-danger" @click="detail = v; cancelOpen = true">Batalkan</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!pageRows.length"><td colspan="9" class="empty">Belum ada kunjungan yang cocok.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span>{{ rows.length }} kunjungan · halaman {{ page }} / {{ pages }}</span>
          <span><button :disabled="page <= 1" @click="page--">Sebelumnya</button><button :disabled="page >= pages" @click="page++">Berikutnya</button></span>
        </div>
        <p class="hint">Menunggu poli merupakan status antrean, bukan status kunjungan.</p>
      </div>
    </div>

    <PatientSearchModal v-model="searchOpen" :initial-query="searchQ" />

    <AppModal v-model="detailOpen" title="Detail kunjungan">
      <template v-if="detail && detailPt">
        <PatientBanner :patient="detailPt" :visit="detail" />
        <dl class="kv">
          <dt>Antrean poli</dt><dd>{{ detail.antreanPoli.nomor }} <StatusBadge :value="detail.antreanPoli.status" /></dd>
          <dt>Status kunjungan</dt><dd><StatusBadge :value="detail.status" /></dd>
          <dt>Poli / dokter</dt><dd>{{ poli(detail.poliId)?.nama }} · {{ doctor(detail.doctorId)?.nama }}</dd>
          <dt>Jenis / kanal</dt><dd>{{ detail.tipe }} · <StatusBadge :value="detail.kanal" /></dd>
          <dt>Keluhan</dt><dd>{{ detail.keluhan || '-' }}</dd>
          <dt>Jam daftar</dt><dd>{{ fmtJam(detail.jamDaftar) }}</dd>
          <dt>SEP</dt><dd><template v-if="detail.sep"><StatusBadge :value="detail.sep.status" /> {{ detail.sep.noSep }}</template><template v-else>-</template></dd>
          <dt>Satu Sehat</dt><dd><StatusBadge :value="detail.satuSehat" /></dd>
          <template v-if="detail.pembatalan"><dt>Pembatalan</dt><dd>{{ detail.pembatalan.alasan }} · {{ detail.pembatalan.ket }} ({{ detail.pembatalan.petugas }})</dd></template>
        </dl>
      </template>
      <template #footer>
        <button class="btn" @click="detailOpen = false">Tutup</button>
        <button v-if="canCancel(detail)" class="btn btn-danger" @click="askCancel">Batalkan kunjungan</button>
        <NuxtLink v-if="detail" :to="'/pasien/' + detail.patientId" class="btn btn-primary" @click="detailOpen = false">Buka data pasien</NuxtLink>
      </template>
    </AppModal>

    <CancelVisitModal v-model="cancelOpen" :visit="detail" @done="lastCancelled" />
  </div>
</template>
