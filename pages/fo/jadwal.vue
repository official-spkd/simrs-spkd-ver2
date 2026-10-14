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
</script>

<template>
  <div>
    <PageHead code="FO-10" role="Front Office · baca saja" title="Jadwal & Kuota Dokter" subtitle="Kuota satu sumber untuk loket, APM, dan reservasi. Perubahan jadwal dilakukan IT (IT-03).">
      <template #actions>
        <div class="seg" role="group" aria-label="Minggu">
          <button type="button" :class="{ on: minggu === 0 }" @click="minggu = 0">Minggu ini</button>
          <button type="button" :class="{ on: minggu === 1 }" @click="minggu = 1">Minggu depan</button>
        </div>
      </template>
    </PageHead>

    <div class="card">
      <div class="filters">
        <div class="field"><label for="j-poli" class="small">Poli</label>
          <select id="j-poli" v-model="fPoli" class="select"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select></div>
        <div class="field"><label for="j-hari" class="small">Hari</label>
          <select id="j-hari" v-model="fHari" class="select"><option value="">Semua hari</option><option v-for="h in [1, 2, 3, 4, 5, 6, 0]" :key="h" :value="String(h)">{{ hariNama(h) }}</option></select></div>
        <div class="muted small" style="align-self: center">{{ fmtTgl(start) }} – {{ fmtTgl(addDays(start, 6)) }}</div>
      </div>

      <div class="table-wrap">
        <table class="tbl" style="min-width: 640px">
          <thead>
            <tr>
              <th style="position: sticky; left: 0; background: #eaf1f4; min-width: 170px">Dokter</th>
              <th v-for="d in days" :key="d.iso" style="min-width: 150px">{{ hariNama(d.hari) }}<div class="muted small" style="font-weight: 500">{{ fmtTgl(d.iso) }}</div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dr in doctors" :key="dr.id">
              <td style="position: sticky; left: 0; background: #fff; vertical-align: top"><b>{{ dr.nama }}</b><div class="muted small">{{ poli(dr.poliId)?.nama }}</div></td>
              <td v-for="d in days" :key="d.iso" style="vertical-align: top" :style="cell(dr.id, d.iso)?.cuti ? 'background: var(--warn-bg)' : ''">
                <template v-if="cell(dr.id, d.iso)">
                  <div class="bold">{{ cell(dr.id, d.iso).mulai }}–{{ cell(dr.id, d.iso).selesai }}</div>
                  <div class="small">Kuota {{ cell(dr.id, d.iso).kuota }} · terisi {{ cell(dr.id, d.iso).terisi }}</div>
                  <div class="muted small">L {{ cell(dr.id, d.iso).terisiLoket }} · APM {{ cell(dr.id, d.iso).terisiApm }} · Rsv {{ cell(dr.id, d.iso).terisiReservasi }}</div>
                  <div style="margin-top: 4px">
                    <span class="badge" :class="cell(dr.id, d.iso).sisa > 0 ? 'b-ok' : 'b-err'">Sisa {{ cell(dr.id, d.iso).sisa }}</span>
                    <span v-if="cell(dr.id, d.iso).cuti" class="badge b-warn" style="margin-left: 4px">Cuti</span>
                  </div>
                </template>
                <span v-else class="muted">-</span>
              </td>
            </tr>
            <tr v-if="!doctors.length"><td :colspan="days.length + 1" class="empty">Tidak ada dokter.</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">L = loket, APM = anjungan mandiri, Rsv = reservasi. Geser tabel ke samping pada layar kecil.</p>
    </div>
  </div>
</template>
