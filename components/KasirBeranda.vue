<script setup lang="ts">
// GL-02 Beranda Kasir: ringkasan tagihan, shift aktif, dan status sistem.
const { user } = useAuth()
const { db, billTotals, patient, currentShift, shiftSummary } = useDb()

const t = todayStr()
const aktif = computed(() => db.visits.filter((v: any) => v.tanggal === t && v.status !== 'dibatalkan'))
const siap = computed(() => aktif.value.filter((v: any) => v.status === 'selesai'))
const terdaftar = computed(() => aktif.value.filter((v: any) => v.status === 'terdaftar').length)
const dilayani = computed(() => aktif.value.filter((v: any) => v.status === 'dilayani').length)
const lunas = computed(() => aktif.value.filter((v: any) => v.status === 'lunas').length)
const pays = computed(() => Object.values(db.bills).flatMap((b: any) => b.payments || []))
const penerimaan = computed(() => pays.value.reduce((s: number, p: any) => s + p.jumlah, 0))
const totalSementara = computed(() => siap.value.reduce((s: number, v: any) => s + billTotals(v.id).net, 0))
const ringkas = computed(() => siap.value.slice(0, 3))
const shift = computed(() => currentShift())
const shiftSum = computed(() => (shift.value ? shiftSummary(shift.value) : null))
const depan = computed(() => (user.value?.nama || '').split(' ')[0])
const sapaan = computed(() => { const h = new Date().getHours(); return h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam' })
const billLabel = (id: string) => { const b = db.bills[id]; return !b || b.status === 'draf' ? 'Draf' : b.status === 'final' ? 'Final · INV' : 'Lunas' }
const outbox = (s: string) => db.outbox.filter((o: any) => o.status === s).length
const tv = computed(() => db.devices.find((d: any) => d.tipe === 'Display' && d.terdaftar))
</script>

<template>
  <div v-if="user">
    <PageHead code="GL-02" role="Kasir" title="Beranda Kasir" :subtitle="`Selamat ${sapaan}, ${depan}. Ringkasan ${fmtTglPanjang()} · per ${fmtJam(new Date().toISOString())}.`" />

    <div class="grid g4">
      <div class="kpi"><small>Siap bayar</small><b>{{ siap.length }}</b><span>Kunjungan selesai · siap finalisasi</span></div>
      <div class="kpi"><small>Menunggu klinis</small><b>{{ terdaftar + dilayani }}</b><span>{{ terdaftar }} terdaftar · {{ dilayani }} dilayani</span></div>
      <div class="kpi"><small>Lunas hari ini</small><b>{{ lunas }}</b><span>Transaksi pembayaran selesai</span></div>
      <div class="kpi"><small>Penerimaan hari ini</small><b>{{ fmtRp(penerimaan) }}</b><span>Dari {{ pays.length }} transaksi lunas</span></div>
    </div>

    <div class="split-r" style="margin-top: 16px">
      <div class="stack">
        <div class="card">
          <h2>Akses cepat</h2>
          <div class="row">
            <NuxtLink to="/kasir" class="btn btn-primary">Buka Worklist Tagihan</NuxtLink>
            <NuxtLink to="/kasir/invoice" class="btn">Invoice &amp; kwitansi</NuxtLink>
            <NuxtLink to="/kasir/shift" class="btn">Rekap penerimaan shift</NuxtLink>
          </div>
          <div class="alert" style="margin-top: 14px"><span>Pembayaran dibuka melalui tagihan. Hanya kunjungan selesai yang dapat difinalisasi; total draf masih sementara.</span></div>
        </div>

        <div class="card">
          <h2>Tagihan belum dibayar</h2>
          <div class="row" style="margin-bottom: 14px"><span class="badge b-warn">{{ siap.length }} kunjungan siap bayar</span><span class="muted">Total sementara {{ fmtRp(totalSementara) }}</span></div>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Pasien / RM</th><th>Penjamin</th><th>Tagihan</th><th>Total sementara</th></tr></thead>
              <tbody>
                <tr v-if="!ringkas.length"><td class="empty" colspan="4">Tidak ada tagihan yang menunggu.</td></tr>
                <tr v-for="v in ringkas" :key="v.id" class="click" @click="navigateTo('/kasir/' + v.id)">
                  <td data-label="Pasien / RM">{{ patient(v.patientId).nama }} · RM{{ patient(v.patientId).rm }}</td>
                  <td data-label="Penjamin">{{ v.penjamin }}</td>
                  <td data-label="Tagihan">{{ billLabel(v.id) }}</td>
                  <td data-label="Total sementara" class="num-link">{{ fmtRp(billTotals(v.id).net) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="hint">Ringkasan {{ ringkas.length }} dari {{ siap.length }} tagihan. Porsi penjamin dihitung di detail; total tagihan BPJS bukan kewajiban bayar pasien.</p>
          <div class="row" style="margin-top: 12px"><NuxtLink to="/kasir" class="btn">Lihat semua tagihan →</NuxtLink></div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h2>Role &amp; unit aktif</h2>
          <span class="badge b-teal">Kasir · aktif</span>
          <p class="bold" style="margin-top: 14px">{{ user.nama }}</p>
          <p style="margin-top: 10px">{{ user.unit }}</p>
          <p class="muted" style="margin-top: 10px">Shift berjalan sejak {{ shift ? fmtJam(shift.mulai) : '-' }}. Menu kasir mengikuti hak akses akun aktif.</p>
          <div class="alert" style="margin-top: 14px"><span>Menu mengikuti hak akses akun. Tidak ada role lain yang diberikan.</span></div>
        </div>

        <div class="card">
          <h2>Ringkasan shift</h2>
          <span class="badge b-ok"><span class="dot" style="width: 6px; height: 6px; margin-right: 5px" /> {{ shift ? 'Shift aktif' : 'Tidak ada shift' }}</span>
          <p class="bold" style="margin-top: 14px">{{ shift ? fmtJam(shift.mulai) + ' · ' + shift.kasir : '-' }}</p>
          <p style="margin-top: 10px">{{ shiftSum?.transaksi || 0 }} transaksi lunas di shift ini · {{ fmtRp(shiftSum?.total || 0) }}</p>
          <div class="alert" style="margin-top: 14px"><span>QRIS / VA menggunakan gateway stub / simulasi, bukan koneksi produksi.</span></div>
          <div class="row" style="margin-top: 14px"><NuxtLink to="/kasir/shift" class="btn">Buka rekap penerimaan shift</NuxtLink></div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h2>Status sistem</h2>
      <div class="row">
        <span v-if="tv" class="badge" :class="tv.online ? 'b-ok' : 'b-err'"><span class="dot" style="width: 6px; height: 6px; margin-right: 5px" /> {{ tv.nama }} {{ tv.online ? 'terhubung' : 'terputus' }}</span>
        <span class="badge b-warn">Satu Sehat: {{ outbox('terkirim') }} terkirim · {{ outbox('antrian') }} antrian · {{ outbox('gagal') }} gagal</span>
        <span class="badge b-info">BPJS VClaim / Antrol · simulasi</span>
      </div>
      <p class="muted" style="margin-top: 12px">Gangguan integrasi tidak menghalangi pelayanan. Data tersimpan lokal; petugas tetap dapat melanjutkan pekerjaan.</p>
    </div>
  </div>
</template>
