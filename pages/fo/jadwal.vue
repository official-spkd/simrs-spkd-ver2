<script setup lang="ts">
import type { ApiPoli } from '~/composables/usePolis'
import type { ApiDoctor } from '~/composables/useDoctors'
import type { ApiAvailability } from '~/composables/useSchedules'
// FO-10 Jadwal & Kuota Dokter (baca saja) — dari server (/api/v1/availability): jam praktik, kuota & sisa per dokter per tanggal.
// Kuota satu sumber untuk loket, APM, dan reservasi; server menolak pendaftaran bila kuota habis.
const toast = useToast()
const svc = useSchedules()

const fPoli = ref('')
const fHari = ref('')
const minggu = ref(0)
const polis = ref<ApiPoli[]>([])
const dokters = ref<ApiDoctor[]>([])
const rows = ref<ApiAvailability[]>([])
const loading = ref(false)

const start = computed(() => addDays(todayStr(), minggu.value * 7))
const days = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(start.value, i)
    return { iso, hari: new Date(iso + 'T00:00:00').getDay() }
  }).filter((d) => fHari.value === '' || d.hari === Number(fHari.value)),
)
const doctors = computed(() => dokters.value.filter((d) => !fPoli.value || d.poli?.id === fPoli.value))
const index = computed(() => new Map(rows.value.map((r) => [r.doctor.id + r.date, r])))
const cell = (doctorId: string, iso: string) => index.value.get(doctorId + iso)

const muat = async () => {
  loading.value = true
  try { rows.value = await svc.availability({ from: start.value, to: addDays(start.value, 6), poli_id: fPoli.value || undefined }) } catch (e: any) { rows.value = []; toast.err(e.message) } finally { loading.value = false }
}
onMounted(async () => {
  try {
    const [p, d] = await Promise.all([usePolis().all(), useDoctors().all({ is_active: true })])
    polis.value = p.filter((x) => x.is_active)
    dokters.value = d
  } catch (e: any) { toast.err(e.message) }
  muat()
})
watch([minggu, fPoli], muat)
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
          <select id="j-poli" v-model="fPoli" class="select"><option value="">Semua poli</option><option v-for="p in polis" :key="p.id" :value="p.id">{{ p.name }}</option></select></div>
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
              <td style="position: sticky; left: 0; background: #fff; vertical-align: top"><b>{{ dr.name }}</b><div class="muted small">{{ dr.poli?.name }}</div></td>
              <td v-for="d in days" :key="d.iso" style="vertical-align: top" :style="cell(dr.id, d.iso)?.status === 'leave' ? 'background: var(--warn-bg)' : ''">
                <template v-if="cell(dr.id, d.iso)">
                  <div class="bold">{{ cell(dr.id, d.iso).start_time }}–{{ cell(dr.id, d.iso).end_time }}</div>
                  <template v-if="cell(dr.id, d.iso).status !== 'leave'">
                    <div class="small">Kuota {{ cell(dr.id, d.iso).total_quota }} · terisi {{ cell(dr.id, d.iso).filled }}</div>
                    <div style="margin-top: 4px">
                      <span class="badge" :class="cell(dr.id, d.iso).remaining > 0 ? 'b-ok' : 'b-err'">Sisa {{ cell(dr.id, d.iso).remaining }}</span>
                      <span v-if="cell(dr.id, d.iso).status === 'substitute'" class="badge b-navy" style="margin-left: 4px">Pengganti</span>
                      <div v-if="cell(dr.id, d.iso).replaced_doctor" class="muted small">Menggantikan {{ cell(dr.id, d.iso).replaced_doctor.name }}</div>
                    </div>
                  </template>
                  <div v-else style="margin-top: 4px"><span class="badge b-warn">Cuti</span></div>
                </template>
                <span v-else class="muted">-</span>
              </td>
            </tr>
            <tr v-if="!doctors.length"><td :colspan="days.length + 1" class="empty">{{ loading ? 'Memuat…' : 'Tidak ada dokter.' }}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Terisi = kunjungan yang belum dibatalkan (loket, APM, dan reservasi berbagi satu kuota). Dokter pengganti ikut menampung kunjungan dokter yang cuti. Geser tabel ke samping pada layar kecil.</p>
    </div>
  </div>
</template>
