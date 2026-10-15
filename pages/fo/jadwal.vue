<script setup lang="ts">
// FO-10 Jadwal & Kuota Dokter (baca saja)
const { db, poli, sessionFor } = useDb()

const fPoli = ref('')
const fHari = ref('')
const minggu = ref(0)

const start = computed(() => addDays(todayStr(), minggu.value * 7))
const days = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(start.value, i)
    return { iso, hari: new Date(iso + 'T00:00:00').getDay() }
  }).filter((d) => fHari.value === '' || d.hari === Number(fHari.value)),
)
const doctors = computed(() => db.doctors.filter((d: any) => !fPoli.value || d.poliId === fPoli.value))
const cell = (doctorId: string, iso: string) => sessionFor(doctorId, iso)

// ringkasan & rincian alokasi hari ini (dokter sesuai filter poli)
const hariIni = todayStr()
const alokasi = computed(() => doctors.value.map((dr: any) => ({ dr, s: sessionFor(dr.id, hariIni) })).filter((x: any) => x.s))
const sum = (k: string) => alokasi.value.reduce((n: number, x: any) => n + (x.s[k] || 0), 0)
const penuh = computed(() => alokasi.value.filter((x: any) => x.s.sisa <= 0))
</script>

<template>
  <div>
    <PageHead code="FO-10" role="Front Office / Admin" title="Jadwal & Kuota Dokter" :subtitle="`${fmtTgl(start)} – ${fmtTgl(addDays(start, 6))} · Sumber kuota bersama Loket / APM / Reservasi`" />

    <div class="kl-filters">
      <select id="j-poli" v-model="fPoli" class="select" aria-label="Poli"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
      <select id="j-hari" v-model="fHari" class="select" aria-label="Hari"><option value="">Semua hari</option><option v-for="h in [1, 2, 3, 4, 5, 6, 0]" :key="h" :value="String(h)">{{ hariNama(h) }}</option></select>
      <button type="button" class="btn" @click="minggu--">‹ Minggu lalu</button>
      <button type="button" class="btn" :disabled="minggu === 0" @click="minggu = 0">Minggu ini</button>
      <button type="button" class="btn" @click="minggu++">Minggu berikutnya ›</button>
    </div>
    <div style="margin-bottom: 16px"><span class="badge b-navy">Front Office · Baca saja</span></div>

    <div class="panel">
      <h2>Jadwal mingguan{{ fPoli ? ` · ${poli(fPoli)?.nama}` : '' }}</h2>
      <div class="table-wrap">
        <table class="tbl" style="min-width: 640px">
          <thead>
            <tr>
              <th style="position: sticky; left: 0; background: #eaf1f4; min-width: 170px">Dokter</th>
              <th v-for="d in days" :key="d.iso" style="min-width: 150px">{{ hariNama(d.hari) }}<div class="muted small" style="font-weight: 500">{{ fmtTgl(d.iso) }}</div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(dr, i) in doctors" :key="dr.id" :class="{ sel: i === 0 }">
              <td style="position: sticky; left: 0; background: #fff; vertical-align: top"><b>{{ dr.nama }}</b><div class="muted small">{{ poli(dr.poliId)?.nama }}</div></td>
              <td v-for="d in days" :key="d.iso" style="vertical-align: top" :style="cell(dr.id, d.iso)?.cuti ? 'background: var(--warn-bg)' : ''">
                <template v-if="cell(dr.id, d.iso)">
                  <div class="bold">{{ cell(dr.id, d.iso).mulai }}–{{ cell(dr.id, d.iso).selesai }}</div>
                  <div class="small">{{ cell(dr.id, d.iso).terisi }}/{{ cell(dr.id, d.iso).kuota }} · <template v-if="cell(dr.id, d.iso).sisa > 0">sisa {{ cell(dr.id, d.iso).sisa }}</template><b v-else>PENUH</b></div>
                  <div class="muted small">L {{ cell(dr.id, d.iso).terisiLoket }} · APM {{ cell(dr.id, d.iso).terisiApm }} · Rsv {{ cell(dr.id, d.iso).terisiReservasi }}</div>
                  <div v-if="cell(dr.id, d.iso).cuti" style="margin-top: 4px"><span class="badge b-warn">Cuti</span></div>
                </template>
                <span v-else style="color: var(--teal-d)">Tidak praktik</span>
              </td>
            </tr>
            <tr v-if="!doctors.length"><td :colspan="days.length + 1" class="empty">Tidak ada dokter.</td></tr>
          </tbody>
        </table>
      </div>
      <p class="muted" style="font-size: 12px">L = loket, APM = anjungan mandiri, Rsv = reservasi. Angka terisi merupakan alokasi dari semua kanal; bukan hanya pasien yang hadir.</p>
    </div>

    <div class="grid g4" style="margin-top: 16px">
      <div class="kl-kpi"><small>Kuota hari ini</small><b>{{ sum('kuota') }}</b></div>
      <div class="kl-kpi"><small>Terisi</small><b>{{ sum('terisi') }}</b><span>Loket {{ sum('terisiLoket') }} · APM {{ sum('terisiApm') }} · Reservasi {{ sum('terisiReservasi') }}</span></div>
      <div class="kl-kpi"><small>Sisa tersedia</small><b>{{ sum('sisa') }}</b></div>
      <div class="kl-kpi"><small>Sesi penuh</small><b>{{ penuh.length }}</b><span>{{ penuh.map((x: any) => x.dr.nama.split(',')[0]).join(', ') || '-' }}</span></div>
    </div>

    <div class="panel" style="margin-top: 16px">
      <h2>Rincian alokasi · {{ fmtTglPanjang(hariIni) }}</h2>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Dokter</th><th>Jam praktik</th><th>Total</th><th>Loket</th><th>APM</th><th>Reservasi</th><th>Terisi</th><th>Sisa</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="(x, i) in alokasi" :key="x.dr.id" :class="{ sel: i === 0 }">
              <td>{{ x.dr.nama }}</td><td>{{ x.s.mulai }}–{{ x.s.selesai }}</td><td>{{ x.s.kuota }}</td><td>{{ x.s.terisiLoket }}</td><td>{{ x.s.terisiApm }}</td><td>{{ x.s.terisiReservasi }}</td><td>{{ x.s.terisi }}</td><td>{{ x.s.sisa }}</td>
              <td style="color: var(--teal-d)">{{ x.s.cuti ? 'Cuti' : x.s.sisa > 0 ? 'Tersedia' : 'Penuh · nonaktif' }}</td>
            </tr>
            <tr v-if="!alokasi.length"><td colspan="9" class="empty">Tidak ada dokter berpraktik hari ini.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="guide" style="margin-top: 16px">Jadwal penuh dinonaktifkan di Loket dan APM. Perubahan jadwal, kuota, cuti, atau dokter pengganti dilakukan IT pada IT-03, bukan oleh Front Office.</div>
  </div>
</template>
