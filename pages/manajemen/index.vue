<script setup lang="ts">
const { db, billTotals } = useDb()
const rentang = ref<'hari' | 'minggu' | 'bulan'>('hari')
const t = todayStr()
const dari = computed(() => (rentang.value === 'hari' ? t : rentang.value === 'minggu' ? addDays(t, -6) : addDays(t, -29)))
const label = computed(() => (rentang.value === 'hari' ? 'Hari ini' : rentang.value === 'minggu' ? '7 hari terakhir' : '30 hari terakhir'))

const inRange = (d: string) => d >= dari.value && d <= t
const vs = computed(() => db.visits.filter((v: any) => inRange(v.tanggal)))
const aktif = computed(() => vs.value.filter((v: any) => v.status !== 'dibatalkan'))
const batal = computed(() => vs.value.filter((v: any) => v.status === 'dibatalkan'))
const byKanal = (k: string) => aktif.value.filter((v: any) => v.kanal === k).length
const byPj = (p: string) => aktif.value.filter((v: any) => v.penjamin === p).length
const diPoli = computed(() => db.visits.filter((v: any) => v.tanggal === t && v.status === 'dilayani').length)
const menungguPoli = computed(() => db.visits.filter((v: any) => v.tanggal === t && v.status === 'terdaftar' && ['menunggu', 'dipanggil', 'vital selesai'].includes(v.antreanPoli.status)).length)

const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null)
const tungguPoli = computed(() => avg(aktif.value.filter((v: any) => v.jamPanggil).map((v: any) => menitAntara(v.jamDaftar, v.jamPanggil))))
// Waktu tunggu loket: dari log panggilan bila ada; bila tidak, estimasi dari tiket yang masih menunggu.
const tungguLoket = computed(() => {
  const dipanggilLog = db.queueLog.filter((e: any) => e.type === 'loket' && e.aksi === 'panggil')
  const hasil: number[] = []
  dipanggilLog.forEach((e: any) => {
    const tk = db.loket.find((x: any) => x.nomor === e.nomor)
    if (tk) hasil.push(menitAntara(tk.jam, e.at))
  })
  if (hasil.length) return { v: avg(hasil), est: false }
  const mnt = db.loket.filter((x: any) => x.status === 'menunggu').map((x: any) => menitAntara(x.jam))
  return { v: avg(mnt), est: true }
})

const pembayaran = computed(() => {
  let total = 0, lunas = 0, tagihan = 0
  Object.values(db.bills).forEach((b: any) => {
    ;(b.payments || []).forEach((p: any) => { if (inRange(dateOf(p.at))) total += p.jumlah })
    if (b.status === 'lunas') {
      const v = db.visits.find((x: any) => x.id === b.visitId)
      if (v && inRange(v.tanggal)) { lunas++; tagihan += billTotals(b.visitId).net }
    }
  })
  return { total, lunas, tagihan }
})
const ss = computed(() => {
  const o = db.outbox.filter((x: any) => x.modul === 'Satu Sehat' && inRange(dateOf(x.at)))
  return { terkirim: o.filter((x: any) => x.status === 'terkirim').length, antrian: o.filter((x: any) => x.status === 'antrian').length, gagal: o.filter((x: any) => x.status === 'gagal').length }
})

const hari7 = computed(() => Array.from({ length: 7 }, (_, i) => addDays(t, i - 6)))
const tabel = computed(() =>
  db.polis.map((p: any) => {
    const per = hari7.value.map((d) => db.visits.filter((v: any) => v.poliId === p.id && v.tanggal === d && v.status !== 'dibatalkan').length)
    return { poli: p, per, total: per.reduce((a: number, b: number) => a + b, 0) }
  }),
)
const totalHari = computed(() => hari7.value.map((_, i) => tabel.value.reduce((a: number, r: any) => a + r.per[i], 0)))
const tglPendek = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7)
</script>

<template>
  <div>
    <PageHead code="MG-01" role="Management" title="Dashboard Operasional" subtitle="Ringkasan operasional rumah sakit. Tabel ringkas, tanpa grafik.">
      <template #actions>
        <NuxtLink class="btn btn-primary" :to="`/manajemen/kunjungan?dari=${dari}&sampai=${t}`">Buka laporan kunjungan</NuxtLink>
      </template>
    </PageHead>

    <div class="row between" style="margin-bottom: 14px">
      <div class="seg" role="group" aria-label="Rentang waktu">
        <button :class="{ on: rentang === 'hari' }" @click="rentang = 'hari'">Hari</button>
        <button :class="{ on: rentang === 'minggu' }" @click="rentang = 'minggu'">Minggu</button>
        <button :class="{ on: rentang === 'bulan' }" @click="rentang = 'bulan'">Bulan</button>
      </div>
      <span class="muted small">{{ label }} · {{ fmtTgl(dari) }} s.d. {{ fmtTgl(t) }}</span>
    </div>

    <div class="grid g4" style="margin-bottom: 16px">
      <div class="kpi"><small>Kunjungan terdaftar</small><b>{{ aktif.length }}</b><span>tidak termasuk dibatalkan</span></div>
      <div class="kpi"><small>Per kanal</small><b style="font-size: 18px">Loket {{ byKanal('loket') }} · APM {{ byKanal('apm') }} · Reservasi {{ byKanal('reservasi') }}</b><span>kanal pendaftaran</span></div>
      <div class="kpi"><small>Per penjamin</small><b style="font-size: 18px">Umum {{ byPj('Umum') }} · BPJS {{ byPj('BPJS') }} · Asuransi {{ byPj('Asuransi') }}</b><span>jenis penjamin</span></div>
      <div class="kpi"><small>Pasien di poli (saat ini)</small><b>{{ diPoli }}</b><span>sedang dilayani · {{ menungguPoli }} menunggu</span></div>
    </div>

    <div class="grid g4" style="margin-bottom: 16px">
      <div class="kpi"><small>Rata-rata tunggu poli</small><b>{{ tungguPoli === null ? '-' : tungguPoli + ' mnt' }}</b><span>daftar → dipanggil</span></div>
      <div class="kpi">
        <small>Rata-rata tunggu loket</small><b>{{ tungguLoket.v === null ? '-' : tungguLoket.v + ' mnt' }}</b>
        <span>{{ tungguLoket.est ? 'estimasi dari tiket yang masih menunggu' : 'dari log pemanggilan' }}</span>
      </div>
      <div class="kpi"><small>Pendapatan</small><b>{{ fmtRp(pembayaran.total) }}</b><span>{{ pembayaran.lunas }} tagihan lunas · total tagihan {{ fmtRp(pembayaran.tagihan) }}</span></div>
      <div class="kpi"><small>Kunjungan dibatalkan</small><b>{{ batal.length }}</b><span><NuxtLink to="/manajemen/pembatalan">Lihat laporan pembatalan</NuxtLink></span></div>
    </div>

    <div class="card" style="margin-bottom: 16px">
      <h2>Status kirim Satu Sehat</h2>
      <div class="row">
        <span class="badge b-ok">Terkirim {{ ss.terkirim }}</span>
        <span class="badge b-warn">Antrian {{ ss.antrian }}</span>
        <span class="badge b-err">Gagal {{ ss.gagal }}</span>
        <span class="muted small">Gangguan pengiriman tidak menghentikan loket, poli, atau kasir.</span>
      </div>
    </div>

    <div class="card">
      <h2>Kunjungan 7 hari terakhir per poli</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead>
            <tr>
              <th>Poli</th>
              <th v-for="d in hari7" :key="d" class="right">{{ tglPendek(d) }}</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in tabel" :key="r.poli.id">
              <td data-label="Poli"><b>{{ r.poli.nama }}</b> <span class="muted small">({{ r.poli.kode }})</span></td>
              <td v-for="(n, i) in r.per" :key="i" class="right" :data-label="tglPendek(hari7[i])">{{ n }}</td>
              <td class="right bold" data-label="Total">{{ r.total }}</td>
            </tr>
            <tr>
              <td data-label="Poli"><b>Semua poli</b></td>
              <td v-for="(n, i) in totalHari" :key="i" class="right bold" :data-label="tglPendek(hari7[i])">{{ n }}</td>
              <td class="right bold" data-label="Total">{{ totalHari.reduce((a: number, b: number) => a + b, 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Data prototipe hanya mencakup hari ini; hari sebelumnya ditampilkan apa adanya (0 bila belum ada kunjungan tercatat).</p>
    </div>
  </div>
</template>
