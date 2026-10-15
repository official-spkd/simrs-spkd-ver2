<script setup lang="ts">
// GL-02 Beranda Front Office / Admin
const { db, patient, poli, doctor } = useDb()
const { user, logout } = useAuth()
// antrean loket dari server, dimuat ulang tiap 10 detik; loket terpilih dibagi dengan FO-07
const { lokets, loketId, loket, aktif, menunggu: tiketMenunggu, poll } = useCounters()
poll(10000)

const t = todayStr()
const now = ref(new Date().toISOString())
const hari = computed(() => db.visits.filter((v: any) => v.tanggal === t))
const dilayani = computed(() => hari.value.filter((v: any) => v.status === 'dilayani'))
const kanal = (k: string) => hari.value.filter((v: any) => v.kanal === k).length

const reservasi = computed(() => db.reservations.filter((r: any) => r.tanggal === t && r.status === 'booked').slice().sort((a: any, b: any) => (a.jam > b.jam ? 1 : -1)))
const rsvPertama = computed(() => reservasi.value[0] || null)

const salam = computed(() => {
  const h = new Date(now.value).getHours()
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
})
const namaSapaan = computed(() => (user.value?.nama || '').split(' ')[0])

// loket yang sedang memanggil: loket terpilih, bila kosong loket lain yang sedang memegang nomor
const dipanggil = computed(() => {
  if (aktif.value) return { nomor: aktif.value.nomor, loket: loket.value?.nama }
  const l = lokets.value.find((x: any) => x.current)
  return l ? { nomor: l.current.nomor, loket: l.nama } : null
})

// ringkasan per poli; poli tanpa kunjungan hari ini tetap tampil
const perPoli = computed(() => {
  const rows = db.polis.filter((p: any) => p.aktif).map((p: any) => {
    const vs = hari.value.filter((v: any) => v.poliId === p.id)
    const n = (s: string) => vs.filter((v: any) => v.status === s).length
    return { id: p.id, nama: p.nama, terdaftar: n('terdaftar'), dilayani: n('dilayani'), selesai: n('selesai'), lunas: n('lunas'), batal: n('dibatalkan'), total: vs.length }
  })
  const sum = (k: string) => rows.reduce((s: number, r: any) => s + r[k], 0)
  const total = { id: 'total', nama: 'Total', terdaftar: sum('terdaftar'), dilayani: sum('dilayani'), selesai: sum('selesai'), lunas: sum('lunas'), batal: sum('batal'), total: sum('total') }
  return { rows, total }
})

// status sistem
const vwr = computed(() => db.devices.find((d: any) => d.tipe === 'Display'))
const ss = computed(() => {
  const o = db.outbox.filter((x: any) => x.modul === 'Satu Sehat')
  return { terkirim: o.filter((x: any) => x.status === 'terkirim').length, antrian: o.filter((x: any) => x.status === 'antrian').length, gagal: o.filter((x: any) => x.status === 'gagal').length }
})

const cari = ref(false)
</script>

<template>
  <div>
    <PageHead code="GL-02" role="Front Office / Admin" title="Beranda Front Office" :subtitle="`${salam}, ${namaSapaan}. Ringkasan pelayanan ${fmtTglPanjang()}.`" />

    <div class="grid g4">
      <div class="kl-kpi"><small>Kunjungan hari ini</small><b>{{ hari.length }}</b><span>{{ kanal('loket') }} Loket · {{ kanal('apm') }} APM · {{ kanal('reservasi') }} Reservasi</span></div>
      <div class="kl-kpi"><small>Menunggu loket</small><b>{{ tiketMenunggu.length }}</b><span>{{ dipanggil ? `${dipanggil.nomor} sedang dipanggil · ${dipanggil.loket}` : 'Belum ada nomor dipanggil' }}</span></div>
      <div class="kl-kpi"><small>Sedang di poli</small><b>{{ dilayani.length }}</b><span>Status kunjungan: dilayani</span></div>
      <div class="kl-kpi"><small>Belum check-in</small><b>{{ reservasi.length }}</b><span>Reservasi hari ini</span></div>
    </div>

    <div class="kl-cols" style="margin-top: 16px">
      <div class="kl-col">
        <div class="panel">
          <h2>Akses cepat</h2>
          <div class="row" style="gap: 12px">
            <button class="btn" @click="cari = true">Cari pasien</button>
            <NuxtLink to="/pasien/baru" class="btn">+ Pasien baru</NuxtLink>
            <NuxtLink to="/kunjungan/baru" class="btn btn-primary">+ Kunjungan</NuxtLink>
            <NuxtLink to="/fo/reservasi" class="btn">+ Reservasi</NuxtLink>
          </div>
          <div class="guide">Loket dan APM memakai satu sumber kuota. Data selalu disimpan lokal sebelum dikirim ke integrasi.</div>
        </div>

        <div class="panel">
          <h2>Aktivitas pelayanan hari ini</h2>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Poli</th><th>Terdaftar</th><th>Dilayani</th><th>Selesai</th><th>Lunas</th><th>Batal</th><th>Total</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in [...perPoli.rows, perPoli.total]" :key="r.id" :class="{ sel: i === 0 }">
                  <td>{{ r.nama }}</td><td>{{ r.terdaftar }}</td><td>{{ r.dilayani }}</td><td>{{ r.selesai }}</td><td>{{ r.lunas }}</td><td>{{ r.batal }}</td>
                  <td style="color: var(--teal-d)">{{ r.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="row" style="gap: 12px">
            <NuxtLink to="/fo" class="btn">Buka pendaftaran</NuxtLink>
            <NuxtLink to="/monitor" class="btn">Monitor antrean poli</NuxtLink>
          </div>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Role &amp; unit aktif</h2>
          <div><span class="badge b-teal">Front Office / Admin · aktif</span></div>
          <p style="font-size: 14px">{{ user?.nama }} · {{ user?.username }}</p>
          <p style="font-size: 14px; font-weight: 600">Pilih role yang diizinkan</p>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Role</th><th>Akses akun</th></tr></thead>
              <tbody><tr class="sel"><td>{{ ROLE_LABEL[user?.role as Role] }}</td><td style="color: var(--teal-d)">✓ Dipilih</td></tr></tbody>
            </table>
          </div>
          <p class="muted" style="font-size: 12px">Pilihan hanya menampilkan role yang diberikan IT. Menu mengikuti role aktif.</p>
          <div class="row" style="gap: 12px">
            <select v-model="loketId" class="select" style="width: auto" aria-label="Loket aktif">
              <option v-if="!lokets.length" value="">Loket</option>
              <option v-for="l in lokets" :key="l.id" :value="l.id" :disabled="!l.aktif">{{ l.nama }}</option>
            </select>
            <button class="btn" @click="logout">Keluar</button>
          </div>
        </div>

        <div class="panel">
          <h2>Reservasi perlu check-in</h2>
          <template v-if="rsvPertama">
            <p style="font-size: 14px; font-weight: 600">{{ rsvPertama.kode }} · {{ patient(rsvPertama.patientId)?.nama }}</p>
            <p style="font-size: 14px">{{ poli(rsvPertama.poliId)?.kode }} · {{ (doctor(rsvPertama.doctorId)?.nama || '').split(',')[0].split(' ').slice(0, 2).join(' ') }} · {{ rsvPertama.jam }}</p>
            <div><span class="badge b-warn">Booked · belum hadir</span></div>
          </template>
          <p v-else class="muted">Semua reservasi hari ini sudah check-in.</p>
          <div class="row"><NuxtLink to="/fo/reservasi" class="btn">Buka reservasi</NuxtLink></div>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top: 16px">
      <h2>Status sistem</h2>
      <div class="row" style="gap: 16px">
        <span class="badge" :class="vwr?.online ? 'b-ok' : 'b-err'">● {{ vwr?.nama || 'Display' }} {{ vwr?.online ? 'terhubung' : 'terputus' }}</span>
        <span class="badge" :class="ss.gagal ? 'b-warn' : 'b-ok'">Satu Sehat: {{ ss.terkirim }} terkirim · {{ ss.antrian }} antrian · {{ ss.gagal }} gagal</span>
        <span class="badge b-navy">BPJS VClaim / Antrol · simulasi</span>
      </div>
      <p class="muted">Gangguan integrasi tidak menghalangi pendaftaran, poli, atau kasir. Petugas melanjutkan pelayanan dari data lokal.</p>
    </div>

    <PatientSearchModal v-model="cari" />
  </div>
</template>
