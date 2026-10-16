<script setup lang="ts">
// APM-06 Pilih poli & dokter (satu layar) — poli & dokter dari GET /api/v1/apm/polis & /apm/doctors,
// pendaftaran lewat POST /api/v1/apm/visits. Server belum mengirim kuota/jadwal: jam praktik diambil dari
// master jadwal lokal (IT-03) bila dokternya terpetakan, kuota tidak ditampilkan.
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { db, sessionFor } = useDb()
const { pasien } = apm
// ikon per kode poli (sesuai Figma); poli lain memakai stetoskop
const IKON: Record<string, string> = { PD: 'heart-pulse', AN: 'baby', UM: 'stethoscope', GG: 'smile' }
const kartu = ref<any[]>([])
const memuat = ref(true)
const pesan = ref('')
const busy = ref(false)
const tglPanjang = fmtTglPanjang()
const jam = (s: string) => s.replace(':', '.')
const jadwal = (serverId: string) => {
  const d = db.doctors.find((x: any) => x.serverId === serverId)
  return d ? sessionFor(d.id, todayStr()) : null
}
const muat = async () => {
  memuat.value = true
  pesan.value = ''
  try {
    const [ps, ds] = await Promise.all([apmApi.polis(), apmApi.doctors()])
    kartu.value = (ps || []).map((p: any) => ({
      id: p.id, kode: p.prefix_code, nama: p.name, ruang: p.room,
      ds: (ds || []).filter((d: any) => d.poli?.id === p.id).map((d: any) => ({ id: d.id, nama: d.name, spesialis: d.specialization, poliId: p.id, sesi: jadwal(d.id) })),
    })).filter((p: any) => p.ds.length)
  } catch (e: any) {
    pesan.value = apmPesan(e)
  } finally {
    memuat.value = false
  }
}
const dipilih = computed(() => kartu.value.find((p: any) => p.id === apm.state.value.poliId) || null)
const dokter = computed(() => dipilih.value?.ds.find((d: any) => d.id === apm.state.value.doctorId) || null)
onMounted(async () => {
  if (!pasien.value || !apm.state.value.confirmed) return navigateTo(apm.state.value.mode === 'baru' ? '/apm/baru' : '/apm/identifikasi')
  await muat()
  // pilih otomatis poli pertama agar daftar dokter langsung tampil
  if (!dipilih.value) pilihPoli(kartu.value[0])
})
const pilihPoli = (p: any) => {
  if (!p) return
  pesan.value = ''
  apm.state.value.poliId = p.id
  apm.state.value.doctorId = p.ds[0]?.id || ''
}
const pilihDokter = (d: any) => { pesan.value = ''; apm.state.value.doctorId = d.id }
const kembali = () => navigateTo(apm.state.value.mode === 'baru' ? '/apm/baru' : '/apm/menu')
const lanjut = async () => {
  const d = dokter.value
  if (busy.value || !d || !pasien.value) return
  pesan.value = ''
  const pt = pasien.value
  if (pt.penjamin === 'BPJS' && !/^\d{13}$/.test(pt.noKartu || '')) return (pesan.value = 'No. kartu BPJS Anda belum tercatat. Silakan menuju loket pendaftaran.')
  if (pt.penjamin === 'Asuransi') return (pesan.value = 'Penjamin Asuransi dilayani di loket. Silakan ambil nomor loket.')
  busy.value = true
  try {
    const t = await apmApi.daftarKunjungan({
      patient_id: pt.id, poli_id: d.poliId, doctor_id: d.id,
      penjamin: pt.penjamin === 'BPJS' ? 'bpjs' : 'umum',
      ...(pt.penjamin === 'BPJS' ? { bpjs_card_number: pt.noKartu } : {}),
      // kiosk tidak menanyakan jenis kunjungan & keluhan; dilengkapi perawat di pengkajian awal (KL-03)
      visit_type: 'baru', chief_complaint: 'Pendaftaran mandiri (APM)',
    })
    apm.state.value.tiket = t
    apm.state.value.visitId = t.visit_id
    navigateTo('/apm/hasil')
  } catch (e: any) {
    const m = apmPesan(e)
    if (e instanceof ApiError && e.status === 409) pesan.value = 'Anda sudah terdaftar di poli ini hari ini. Silakan menuju loket bila nomor antrean Anda hilang.'
    else if (/responsible/i.test(m)) pesan.value = 'Pasien di bawah 18 tahun wajib didampingi penanggung jawab. Silakan menuju loket pendaftaran.'
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
      <button v-for="p in kartu" :key="p.id" type="button" class="apm-card poli" :class="{ on: dipilih?.id === p.id }" :aria-pressed="dipilih?.id === p.id" @click="pilihPoli(p)">
        <span class="ico"><AppIcon :name="IKON[p.kode] || 'stethoscope'" :size="40" /></span>
        <span class="nm">{{ p.nama }}{{ dipilih?.id === p.id ? ' ✓' : '' }}</span>
      </button>
    </div>
    <p v-if="memuat" class="apm-lead">Memuat poli…</p>
    <div v-else-if="!kartu.length && !pesan" class="apm-alert warn">Tidak ada poli yang buka hari ini. Silakan menuju loket.</div>

    <template v-if="dipilih">
      <p class="sub">Dokter Poli {{ dipilih.nama }} · {{ tglPanjang }}</p>
      <div class="dokters">
        <button v-for="d in dipilih.ds" :key="d.id" type="button" class="apm-card dok" :class="{ on: dokter?.id === d.id }" :aria-pressed="dokter?.id === d.id" @click="pilihDokter(d)">
          <span class="dn">{{ d.nama }}</span>
          <span v-if="d.sesi" class="dj">Jam praktik {{ jam(d.sesi.mulai) }}–{{ jam(d.sesi.selesai) }}</span>
          <span v-if="d.spesialis" class="dk">{{ d.spesialis }}</span>
          <span class="ds">{{ dokter?.id === d.id ? '✓ Dokter dipilih' : 'Sentuh untuk memilih' }}</span>
        </button>
      </div>
    </template>
    <div class="apm-guide">Pendaftaran tercatat langsung di sistem, sama seperti mendaftar di loket.</div>
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
