<script setup lang="ts">
// GL-02 Beranda Dokter / Perawat
const { db, patient } = useDb()
const { user } = useAuth()
const { isDokter, tanggal, sync, rows, dokter, poliAktif, menunggu, dilayani, selesai, lunas } = useDokterQueue()

const now = ref(new Date().toISOString())
let syncTimer: any
// beranda selalu ringkasan hari ini (tanggal worklist bisa diganti di KL-01)
onMounted(() => { tanggal.value = todayStr(); if (isDokter.value) { sync(); syncTimer = setInterval(sync, 15000) } })
onBeforeUnmount(() => clearInterval(syncTimer))

const salam = computed(() => {
  const h = new Date(now.value).getHours()
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
})
const namaSapaan = computed(() => (user.value?.nama || '').split(',')[0].split(' ').slice(0, 2).join(' '))
const unit = computed(() => (poliAktif.value ? 'Poli ' + poliAktif.value.nama : 'Poli penugasan'))

// pasien menunggu: yang sudah dipanggil tampil lebih dulu
const antre = computed(() => menunggu.value.slice().sort((a: any, b: any) => (a.antreanPoli.status === 'dipanggil' ? -1 : 0) - (b.antreanPoli.status === 'dipanggil' ? -1 : 0)))
const top3 = computed(() => antre.value.slice(0, 3))
const pertama = computed(() => top3.value[0] || null)

// status sistem
const vwr = computed(() => db.devices.find((d: any) => d.tipe === 'Display'))
const ss = computed(() => {
  const o = db.outbox.filter((x: any) => x.modul === 'Satu Sehat')
  return { terkirim: o.filter((x: any) => x.status === 'terkirim').length, antrian: o.filter((x: any) => x.status === 'antrian').length, gagal: o.filter((x: any) => x.status === 'gagal').length }
})
</script>

<template>
  <div>
    <PageHead code="GL-02" role="Dokter / Perawat" title="Beranda Dokter / Perawat" :subtitle="`${salam}, ${namaSapaan}. Ringkasan ${fmtTglPanjang()} · per ${fmtJam(now)}.`" />

    <div class="grid g4">
      <div class="kl-kpi"><small>Pasien ditugaskan</small><b>{{ rows.length }}</b><span>{{ unit }} hari ini</span></div>
      <div class="kl-kpi"><small>Menunggu / dipanggil</small><b>{{ menunggu.length }}</b><span>Antrean pelayanan poli</span></div>
      <div class="kl-kpi"><small>Sedang dilayani</small><b>{{ dilayani.length }}</b><span>Vital selesai / diperiksa</span></div>
      <div class="kl-kpi"><small>Pelayanan selesai</small><b>{{ selesai.length + lunas.length }}</b><span>{{ selesai.length }} selesai · {{ lunas.length }} lunas</span></div>
    </div>

    <div class="kl-cols" style="margin-top: 16px">
      <div class="kl-col">
        <div class="panel">
          <h2>Akses cepat</h2>
          <div class="kl-actions">
            <NuxtLink to="/klinis" class="btn btn-primary">Buka Worklist Poli</NuxtLink>
            <NuxtLink to="/klinis/riwayat" class="btn">Riwayat kunjungan</NuxtLink>
            <NuxtLink to="/pasien" class="btn">Data pasien · baca</NuxtLink>
          </div>
          <div class="guide">Dokter dan perawat memakai satu role bersama. Workspace pasien dibuka melalui pasien aktif sesuai penugasan poli.</div>
        </div>

        <div class="panel">
          <h2>Pasien menunggu pelayanan</h2>
          <p class="muted">Ringkasan {{ top3.length }} dari {{ menunggu.length }} pasien menunggu / dipanggil.</p>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Antrean</th><th>Pasien / RM</th><th>Penjamin</th><th>Status antrean</th></tr></thead>
              <tbody>
                <tr v-if="!top3.length"><td class="empty" colspan="4">Tidak ada pasien menunggu.</td></tr>
                <tr v-for="(v, i) in top3" :key="v.id" :class="{ sel: i === 0 }">
                  <td data-label="Antrean">{{ v.antreanPoli.nomor }}</td>
                  <td data-label="Pasien / RM">{{ patient(v.patientId).nama }}<div>RM{{ patient(v.patientId).rm }}</div></td>
                  <td data-label="Penjamin">{{ v.penjamin }}</td>
                  <td data-label="Status antrean" style="color: var(--teal-d); text-transform: capitalize">{{ v.antreanPoli.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="pertama"><NuxtLink :to="'/klinis/' + pertama.id" class="btn btn-primary">Workspace {{ patient(pertama.patientId).nama }} →</NuxtLink></div>
          <p class="hint" style="margin: 0">BPJS: Panggil Pasien → Task 4; Mulai Periksa → Task 5. Pencatatan demo lokal, bukan API nyata. Non-BPJS: tidak berlaku.</p>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Role &amp; unit aktif</h2>
          <div><span class="badge b-teal">Dokter / Perawat · aktif</span></div>
          <p style="font-size: 14px; font-weight: 600">{{ dokter?.nama || user?.nama }}</p>
          <p style="font-size: 14px">{{ unit }}</p>
          <p class="muted">Akses klinis sesuai penugasan. Data pasien tersedia dalam mode baca-saja.</p>
          <div class="guide">Menu mengikuti hak akses akun. Tidak ada role lain yang diberikan.</div>
        </div>
        <div class="panel">
          <h2>Penugasan hari ini</h2>
          <div><span class="badge b-teal">● Unit aktif</span></div>
          <p style="font-weight: 600">{{ unit }}</p>
          <p class="muted">{{ fmtTglPanjang() }}</p>
          <div class="guide">{{ rows.length }} pasien ditugaskan ke poli dan dokter aktif. Lanjutkan antrean melalui Worklist Poli.</div>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top: 16px">
      <h2>Status sistem</h2>
      <div class="kl-actions">
        <span class="badge" :class="vwr?.online ? 'b-ok' : 'b-err'">● {{ vwr?.nama || 'Display' }} {{ vwr?.online ? 'terhubung' : 'terputus' }}</span>
        <span class="badge" :class="ss.gagal ? 'b-warn' : 'b-ok'">Satu Sehat: {{ ss.terkirim }} terkirim · {{ ss.antrian }} antrian · {{ ss.gagal }} gagal</span>
        <span class="badge b-navy">BPJS VClaim / Antrol · simulasi</span>
      </div>
      <p class="muted">Gangguan integrasi tidak menghalangi pelayanan. Data tersimpan lokal; petugas tetap dapat melanjutkan pekerjaan.</p>
    </div>
  </div>
</template>
