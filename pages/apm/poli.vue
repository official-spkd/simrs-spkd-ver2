<script setup lang="ts">
// APM-06 Pilih poli & dokter (satu layar). Kuota satu sumber dengan loket & reservasi; dikunci saat lanjut.
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { polisAktifHariIni, doctorsOfPoli, registerVisit } = useDb()
const { pasien } = apm

// ikon per kode poli (sesuai Figma); poli lain memakai stetoskop
const IKON: Record<string, string> = { PD: 'heart-pulse', AN: 'baby', UM: 'stethoscope', GG: 'smile' }
const kartu = computed(() => polisAktifHariIni().map((p: any) => {
  const ds = doctorsOfPoli(p.id)
  return { ...p, ds, sisa: ds.reduce((s: number, d: any) => s + d.sesi.sisa, 0) }
}))
const dipilih = computed(() => kartu.value.find((p: any) => p.id === apm.state.value.poliId) || null)
const dokter = computed(() => dipilih.value?.ds.find((d: any) => d.id === apm.state.value.doctorId) || null)
const pesan = ref('')
const busy = ref(false)
const tglPanjang = fmtTglPanjang()
const jam = (s: string) => s.replace(':', '.')

onMounted(() => {
  if (!pasien.value || !apm.state.value.confirmed) return navigateTo(apm.state.value.mode === 'baru' ? '/apm/baru' : '/apm/identifikasi')
  // pilih otomatis poli pertama yang masih punya kuota agar daftar dokter langsung tampil
  if (!dipilih.value) pilihPoli(kartu.value.find((p: any) => p.sisa > 0))
})
const pilihPoli = (p: any) => {
  if (!p || p.sisa <= 0) return
  pesan.value = ''
  apm.state.value.poliId = p.id
  const d = p.ds.find((x: any) => x.sesi.sisa > 0)
  apm.state.value.doctorId = d?.id || ''
}
const pilihDokter = (d: any) => { if (d.sesi.sisa > 0) { pesan.value = ''; apm.state.value.doctorId = d.id } }
const kembali = () => navigateTo(apm.state.value.mode === 'baru' ? '/apm/baru' : '/apm/menu')

const lanjut = () => {
  const d = dokter.value
  if (busy.value || !d || !pasien.value) return
  pesan.value = ''
  busy.value = true
  const pt = pasien.value
  try {
    if (pt.penjamin === 'BPJS' && !/^\d{13}$/.test(pt.noKartu || '')) throw new Error('No. kartu BPJS Anda belum tercatat. Silakan menuju loket pendaftaran.')
    if (pt.penjamin === 'Asuransi') throw new Error('Penjamin Asuransi dilayani di loket. Silakan ambil nomor loket.')
    const v = registerVisit({
      patientId: pt.id, poliId: d.poliId, doctorId: d.id, kanal: 'apm', persetujuan: true,
      penjamin: pt.penjamin, noKartu: pt.penjamin === 'BPJS' ? pt.noKartu : '', keluhan: 'Pendaftaran mandiri',
    })
    apm.state.value.visitId = v.id
    navigateTo('/apm/hasil')
  } catch (e: any) {
    const m: string = e.message || String(e)
    if (m.includes('409') || m.toLowerCase().includes('kuota')) pesan.value = 'Mohon maaf, kuota dokter ini baru saja habis. Silakan pilih dokter lain atau menuju loket.'
    else if (m.includes('sudah punya kunjungan')) pesan.value = 'Anda sudah terdaftar di poli ini hari ini. ' + m.replace(/^.*\(/, 'Nomor antrean Anda: ').replace(')', '') + '.'
    else pesan.value = m
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <ApmShell kode="APM-06" langkah="Langkah 3 · Tujuan pelayanan" :back="false">
    <h1 class="apm-h1">Pilih poli &amp; dokter</h1>
    <p class="apm-lead">Pilih poli tujuan untuk kunjungan hari ini.</p>
    <div v-if="pesan" class="apm-alert" role="alert"><b>Pendaftaran belum berhasil.</b> {{ pesan }}</div>

    <div class="polis">
      <button v-for="p in kartu" :key="p.id" type="button" class="apm-card poli" :class="{ on: dipilih?.id === p.id, off: p.sisa <= 0 }" :disabled="p.sisa <= 0" :aria-pressed="dipilih?.id === p.id" @click="pilihPoli(p)">
        <span class="ico"><AppIcon :name="IKON[p.kode] || 'stethoscope'" :size="40" /></span>
        <span class="nm">{{ p.nama }}{{ dipilih?.id === p.id ? ' ✓' : '' }}</span>
        <span v-if="p.sisa <= 0" class="habis">Kuota habis</span>
      </button>
    </div>
    <div v-if="!kartu.length" class="apm-alert warn">Tidak ada poli yang buka hari ini. Silakan menuju loket.</div>

    <template v-if="dipilih">
      <p class="sub">Dokter Poli {{ dipilih.nama }} · {{ tglPanjang }}</p>
      <div class="dokters">
        <button v-for="d in dipilih.ds" :key="d.id" type="button" class="apm-card dok" :class="{ on: dokter?.id === d.id, off: d.sesi.sisa <= 0 }" :disabled="d.sesi.sisa <= 0" :aria-pressed="dokter?.id === d.id" @click="pilihDokter(d)">
          <span class="dn">{{ d.nama }}</span>
          <span class="dj">Jam praktik {{ jam(d.sesi.mulai) }}–{{ jam(d.sesi.selesai) }}</span>
          <span class="dk">{{ d.sesi.sisa }} dari {{ d.sesi.kuota }} kuota tersisa</span>
          <span class="ds">{{ d.sesi.sisa <= 0 ? (d.sesi.cuti ? 'Dokter cuti · Tidak dapat dipilih' : 'Penuh · Tidak dapat dipilih') : dokter?.id === d.id ? '✓ Dokter dipilih' : 'Sentuh untuk memilih' }}</span>
        </button>
      </div>
    </template>
    <div class="apm-guide">Kuota Loket, APM, dan Reservasi berasal dari satu sumber. Kuota dikunci bersama saat Anda melanjutkan.</div>
    <div class="apm-row">
      <button type="button" class="apm-btn" @click="kembali">‹ Kembali</button>
      <button type="button" class="apm-btn pri" :disabled="!dokter || busy" @click="lanjut">{{ busy ? 'Memproses…' : 'Pilih dokter & lanjut →' }}</button>
    </div>
  </ApmShell>
</template>
<style scoped>
.polis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.poli { min-height: 160px; padding: 24px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; cursor: pointer; font: inherit; text-align: left; }
.poli.on { background: #eaf6f5; border: 2px solid #008d96; padding: 23px; }
.poli.off, .dok.off { background: #edf0f2; cursor: not-allowed; }
.ico { color: #008d96; display: flex; }
.poli.off .ico { color: #9aabb6; }
.nm { font-size: 24px; font-weight: 600; color: #06345d; line-height: 1.45; }
.habis { font-size: 18px; color: #647887; }
.sub { font-size: 28px; font-weight: 600; color: #06345d; margin: 0; }
.dokters { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
.dok { min-height: 244px; padding: 28px; display: flex; flex-direction: column; gap: 20px; text-align: left; cursor: pointer; font: inherit; line-height: 1.45; }
.dok.on { border: 2px solid #008d96; padding: 27px; }
.dn { font-size: 26px; font-weight: 600; color: #06345d; }
.dj { font-size: 24px; color: #173348; }
.dk { font-size: 22px; color: #00747c; }
.ds { font-size: 20px; font-weight: 600; color: #00747c; }
.dok.off .dn, .dok.off .dj, .dok.off .dk, .dok.off .ds { color: #647887; }
@media (max-width: 767px) {
  .poli { min-height: 110px; } .nm { font-size: 20px; } .sub { font-size: 20px; }
  .dok { min-height: 0; padding: 18px; gap: 10px; } .dn { font-size: 20px; } .dj, .dk { font-size: 17px; } .ds { font-size: 16px; }
}
</style>
