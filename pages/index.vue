<script setup lang="ts">
// GL-02 Beranda per role: ringkasan hari ini
const { user } = useAuth()
const { db, billTotals, poli } = useDb()
const role = computed(() => user.value?.role as Role)
const t = todayStr()
const hari = computed(() => db.visits.filter((v: any) => v.tanggal === t))
const aktif = computed(() => hari.value.filter((v: any) => v.status !== 'dibatalkan'))
const menunggu = computed(() => aktif.value.filter((v: any) => v.status === 'terdaftar'))
const dilayani = computed(() => aktif.value.filter((v: any) => v.status === 'dilayani'))
const siapBayar = computed(() => aktif.value.filter((v: any) => v.status === 'selesai'))
const lunas = computed(() => aktif.value.filter((v: any) => v.status === 'lunas'))
// antrean loket menunggu hari ini — dari server (/api/v1/display/queues), dimuat ulang tiap 10 detik
const sisaLoket = ref<number | string>('-')
const muatLoket = () => displayQueues().then((d) => (sisaLoket.value = d.menunggu), () => (sisaLoket.value = '-'))
let tLoket: any
onMounted(() => { if (role.value === 'fo') { muatLoket(); tLoket = setInterval(muatLoket, 10000) } })
onBeforeUnmount(() => clearInterval(tLoket))
const pendapatan = computed(() => Object.values(db.bills).flatMap((b: any) => b.payments || []).reduce((s: number, p: any) => s + p.jumlah, 0))
const gagal = computed(() => db.outbox.filter((o: any) => o.status === 'gagal').length)
const antri = computed(() => db.outbox.filter((o: any) => o.status === 'antrian').length)
const mine = computed(() => (user.value?.poliId ? menunggu.value.filter((v: any) => v.poliId === user.value.poliId) : menunggu.value))
const links: Record<string, { to: string; label: string }[]> = {
  fo: [{ to: '/fo', label: 'Worklist pendaftaran' }, { to: '/fo/antrean', label: 'Pemanggilan antrean loket' }, { to: '/pasien/baru', label: '+ Pasien baru' }, { to: '/fo/reservasi', label: 'Reservasi' }],
  dokter: [{ to: '/klinis', label: 'Worklist poli' }],
  kasir: [{ to: '/kasir', label: 'Worklist tagihan' }, { to: '/kasir/shift', label: 'Rekap shift' }],
  mgmt: [{ to: '/manajemen', label: 'Dashboard operasional' }, { to: '/manajemen/kunjungan', label: 'Laporan kunjungan' }, { to: '/manajemen/pembatalan', label: 'Laporan pembatalan' }],
  it: [{ to: '/it/integrasi', label: 'Status integrasi' }, { to: '/it/audit', label: 'Audit trail' }, { to: '/it/perangkat', label: 'Perangkat' }],
  superadmin: [{ to: '/it/user', label: 'User & role' }, { to: '/it/integrasi', label: 'Status integrasi' }, { to: '/it/audit', label: 'Audit trail' }, { to: '/it/perangkat', label: 'Perangkat' }],
}
const sisaTagihan = computed(() => siapBayar.value.reduce((s: number, v: any) => s + billTotals(v.id).sisa, 0))
</script>

<template>
  <div v-if="user">
    <PageHead code="GL-02" :role="ROLE_LABEL[role]" :title="`Selamat datang, ${user.nama}`" :subtitle="`Ringkasan hari ini · ${fmtTglPanjang()}`" />

    <div class="grid g4">
      <template v-if="role === 'fo'">
        <div class="kpi"><small>Kunjungan hari ini</small><b>{{ aktif.length }}</b><span>{{ hari.length - aktif.length }} dibatalkan</span></div>
        <div class="kpi"><small>Antrean loket menunggu</small><b>{{ sisaLoket }}</b><span>Hari ini, dari server</span></div>
        <div class="kpi"><small>Menunggu poli</small><b>{{ menunggu.length }}</b><span>Terdaftar, belum dilayani</span></div>
        <div class="kpi"><small>Reservasi check-in</small><b>{{ db.reservations.filter((r: any) => r.tanggal === t && r.status === 'booked').length }}</b><span>Pasien belum hadir</span></div>
      </template>
      <template v-else-if="role === 'dokter'">
        <div class="kpi"><small>Pasien menunggu</small><b>{{ mine.length }}</b><span>{{ user.poliId ? poli(user.poliId)?.nama : 'Semua poli' }}</span></div>
        <div class="kpi"><small>Sedang dilayani</small><b>{{ dilayani.length }}</b><span>Hari ini</span></div>
        <div class="kpi"><small>Selesai</small><b>{{ aktif.filter((v: any) => ['selesai', 'lunas'].includes(v.status)).length }}</b><span>Kunjungan ditutup</span></div>
        <div class="kpi"><small>Alergi tercatat</small><b>{{ menunggu.filter((v: any) => db.patients.find((p: any) => p.id === v.patientId)?.alergi).length }}</b><span>Pasien menunggu dengan alergi</span></div>
      </template>
      <template v-else-if="role === 'kasir'">
        <div class="kpi"><small>Tagihan belum bayar</small><b>{{ siapBayar.length }}</b><span>Siap bayar</span></div>
        <div class="kpi"><small>Menunggu klinis</small><b>{{ menunggu.length + dilayani.length }}</b><span>Masih di poli</span></div>
        <div class="kpi"><small>Lunas hari ini</small><b>{{ lunas.length }}</b><span>Kunjungan</span></div>
        <div class="kpi"><small>Penerimaan hari ini</small><b>{{ fmtRp(pendapatan) }}</b><span>Semua metode</span></div>
      </template>
      <template v-else-if="role === 'mgmt'">
        <div class="kpi"><small>Kunjungan terdaftar</small><b>{{ aktif.length }}</b><span>Hari ini</span></div>
        <div class="kpi"><small>Pasien di poli</small><b>{{ dilayani.length }}</b><span>Sedang dilayani</span></div>
        <div class="kpi"><small>Pendapatan hari ini</small><b>{{ fmtRp(pendapatan) }}</b><span>Penerimaan kasir</span></div>
        <div class="kpi"><small>Dibatalkan</small><b>{{ hari.length - aktif.length }}</b><span>Kunjungan</span></div>
      </template>
      <template v-else>
        <div class="kpi"><small>Satu Sehat</small><b>{{ db.integrasi.satuSehat.status }}</b><span>Mode {{ db.integrasi.satuSehat.mode }}</span></div>
        <div class="kpi"><small>Antrian kirim</small><b>{{ antri }}</b><span>Menunggu worker</span></div>
        <div class="kpi"><small>Gagal (DLQ)</small><b :style="{ color: gagal ? 'var(--err)' : '' }">{{ gagal }}</b><span>Perlu kirim ulang</span></div>
        <div class="kpi"><small>Perangkat online</small><b>{{ db.devices.filter((d: any) => d.online && d.terdaftar).length }}/{{ db.devices.length }}</b><span>APM & display</span></div>
      </template>
    </div>

    <div class="grid g2" style="margin-top: 16px">
      <div class="card">
        <h2>Menu cepat</h2>
        <div class="row"><NuxtLink v-for="l in links[role]" :key="l.to" :to="l.to" class="btn btn-primary">{{ l.label }}</NuxtLink></div>
        <p v-if="role === 'kasir'" class="hint">Sisa tagihan siap bayar: <b>{{ fmtRp(sisaTagihan) }}</b></p>
      </div>
      <div class="card">
        <h2>Alur kunjungan rawat jalan</h2>
        <p class="muted">Serah terima antar role lewat status kunjungan:</p>
        <div class="row" style="margin-top: 10px; gap: 6px"><StatusBadge value="terdaftar" /> → <StatusBadge value="dilayani" /> → <StatusBadge value="selesai" /> → <StatusBadge value="lunas" /> <span class="muted small">/ <StatusBadge value="dibatalkan" /> (hanya dari terdaftar)</span></div>
        <p class="hint">Gangguan Satu Sehat atau BPJS tidak pernah menghentikan loket, poli, atau kasir — data disimpan lokal lebih dulu.</p>
      </div>
    </div>
    <div v-if="role !== 'it' && role !== 'superadmin'" class="row" style="margin-top: 16px"><button class="btn btn-sm" @click="useDb().resetDemo()">Reset data demo</button></div>
  </div>
</template>
