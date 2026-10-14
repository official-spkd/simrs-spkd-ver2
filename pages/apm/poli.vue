<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { polisAktifHariIni, doctorsOfPoli, registerVisit, poli: poliOf } = useDb()
const { pasien } = apm

const kartu = computed(() =>
  polisAktifHariIni().map((p: any) => {
    const ds = doctorsOfPoli(p.id)
    return { ...p, ds, sisa: ds.reduce((s: number, d: any) => s + d.sesi.sisa, 0) }
  }),
)
const dipilih = computed(() => kartu.value.find((p: any) => p.id === apm.state.value.poliId) || null)
const pesan = ref('')
const busy = ref(false)

onMounted(() => {
  if (!pasien.value || !apm.state.value.confirmed) navigateTo(apm.state.value.mode === 'baru' ? '/apm/baru' : '/apm/identifikasi')
})

const pilihPoli = (p: any) => {
  if (p.sisa <= 0) return
  pesan.value = ''
  apm.state.value.poliId = p.id
}
const kembali = () => {
  if (dipilih.value) {
    apm.state.value.poliId = ''
    pesan.value = ''
  } else navigateTo('/apm/menu')
}

const pilihDokter = (d: any) => {
  if (busy.value || d.sesi.sisa <= 0 || !pasien.value) return
  pesan.value = ''
  busy.value = true
  const pt = pasien.value
  try {
    if (pt.penjamin === 'BPJS' && !/^\d{13}$/.test(pt.noKartu || '')) throw new Error('No. kartu BPJS Anda belum tercatat. Silakan menuju loket pendaftaran.')
    const v = registerVisit({
      patientId: pt.id, poliId: d.poliId, doctorId: d.id, kanal: 'apm', persetujuan: true,
      penjamin: pt.penjamin, noKartu: pt.penjamin === 'BPJS' ? pt.noKartu : '', keluhan: 'Pendaftaran mandiri',
    })
    apm.state.value.doctorId = d.id
    apm.state.value.visitId = v.id
    navigateTo('/apm/hasil')
  } catch (e: any) {
    const m: string = e.message || String(e)
    if (m.includes('409') || m.toLowerCase().includes('kuota')) pesan.value = 'Mohon maaf, kuota dokter ini sudah habis. Silakan pilih dokter lain atau menuju loket.'
    else if (m.includes('sudah punya kunjungan')) pesan.value = 'Anda sudah terdaftar di poli ini hari ini. ' + m.replace(/^.*\(/, 'Nomor antrean Anda: ').replace(')', '') + '. Silakan menuju loket bila perlu bantuan.'
    else pesan.value = m
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <ApmShell kode="APM-06" langkah="Langkah 4 · Pilih poli & dokter">
    <h1 v-if="!dipilih">Pilih poliklinik tujuan</h1>
    <h1 v-else>Poli {{ dipilih.nama }} · pilih dokter</h1>

    <div v-if="pesan" class="alert err big-alert" role="alert">
      <div><b>Pendaftaran belum berhasil.</b><p>{{ pesan }}</p></div>
    </div>

    <div v-if="!dipilih" class="grid pgrid">
      <button v-for="p in kartu" :key="p.id" class="tile" :class="{ off: p.sisa <= 0 }" :disabled="p.sisa <= 0" @click="pilihPoli(p)">
        <span class="pico"><AppIcon name="stethoscope" :size="38" /></span>
        {{ p.nama }}
        <small v-if="p.sisa > 0">{{ p.ruang }} · sisa kuota {{ p.sisa }}</small>
        <small v-else>Kuota habis</small>
      </button>
      <div v-if="!kartu.length" class="alert warn big-alert">Tidak ada poli yang buka hari ini. Silakan menuju loket.</div>
    </div>

    <div v-else class="grid dgrid">
      <button v-for="d in dipilih.ds" :key="d.id" class="tile" :class="{ off: d.sesi.sisa <= 0 }" :disabled="d.sesi.sisa <= 0 || busy" @click="pilihDokter(d)">
        {{ d.nama }}
        <small>{{ d.spesialis }} · {{ dipilih.ruang }}</small>
        <small>Praktik {{ d.sesi.mulai }}-{{ d.sesi.selesai }}</small>
        <span v-if="d.sesi.sisa > 0" class="kuota">Sisa kuota {{ d.sesi.sisa }} dari {{ d.sesi.kuota }}</span>
        <span v-else class="kuota habis">{{ d.sesi.cuti ? 'Dokter cuti' : 'Kuota habis' }}</span>
      </button>
    </div>

    <div class="row act">
      <button class="btn" @click="kembali">Kembali</button>
      <span v-if="busy" class="muted">Memproses pendaftaran...</span>
    </div>
  </ApmShell>
</template>
<style scoped>
.pgrid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin: 8px 0 24px; }
.dgrid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; margin: 8px 0 24px; }
.tile { min-height: 180px; }
.tile:disabled { pointer-events: none; }
.pico { width: 64px; height: 64px; border-radius: 16px; background: var(--teal-l); color: var(--teal-d); display: grid; place-items: center; }
.tile.off .pico { background: #dde4e8; color: #9aabb6; }
.kuota { display: inline-block; align-self: flex-start; margin-top: 6px; padding: 6px 14px; border-radius: 20px; background: var(--ok-bg); color: var(--ok); font-size: 18px; font-weight: 700; }
.kuota.habis { background: #dde4e8; color: #6a7f8e; }
.big-alert { font-size: 20px; padding: 18px 20px; margin-bottom: 16px; }
.big-alert p { margin: 6px 0 0; }
.act { margin-top: 8px; gap: 16px; }
@media (max-width: 767px) { .pgrid, .dgrid { grid-template-columns: minmax(0, 1fr); } .tile { min-height: 120px; } }
</style>
