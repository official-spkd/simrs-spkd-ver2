<script setup lang="ts">
// APM-07 Hasil & cetak antrean (tiket 80 mm)
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { db, visit, poli, doctor, patientOf } = useDb()

// Tiket dari POST /api/v1/apm/visits; alur check-in booking (lokal) tetap membaca kunjungan lokal.
const tk = computed(() => apm.state.value.tiket)
const v = computed(() => {
  const t = tk.value
  if (!t) return apm.state.value.visitId ? visit(apm.state.value.visitId) : null
  return {
    id: t.visit_id, tanggal: t.visit_date, jamDaftar: t.printed_at || new Date().toISOString(), status: 'terdaftar',
    antreanPoli: { nomor: `${t.poli?.prefix_code}-${t.poli_queue_number}`, status: 'menunggu' }, sep: null,
  }
})
const pl = computed(() => (tk.value ? { nama: tk.value.poli?.name, ruang: tk.value.poli?.room } : v.value ? poli(v.value.poliId) : null))
const dr = computed(() => (tk.value ? { nama: tk.value.doctor?.name } : v.value ? doctor(v.value.doctorId) : null))
const pt = computed(() => (tk.value ? { rm: tk.value.medical_record_number, nama: tk.value.patient_name } : v.value ? patientOf(v.value) : null))
const nomorLoket = computed(() => (tk.value?.queue_number ? fmtNomorLoket(tk.value.queue_number) : ''))
// perkiraan panggil: antrean menunggu di depan × 8 menit (tiket server: urutan nomor poli)
const depan = computed(() => {
  if (!v.value) return 0
  if (tk.value) return Math.max(0, Number(tk.value.poli_queue_number) - 1 || 0)
  return db.visits.filter((x: any) => x.poliId === v.value.poliId && x.tanggal === v.value.tanggal && x.status === 'terdaftar' && ['menunggu', 'dipanggil'].includes(x.antreanPoli.status) && x.jamDaftar < v.value.jamDaftar).length
})
const menit = computed(() => Math.max(5, depan.value * 8))
const jamPanggil = computed(() => fmtJam(new Date(new Date(v.value?.jamDaftar || Date.now()).getTime() + menit.value * 60000).toISOString()))
const sep = computed(() => v.value?.sep || null)
const sepText = computed(() => (!sep.value ? '' : sep.value.status === 'terbit' ? 'SEP terbit' : sep.value.status === 'menunggu' ? 'SEP menunggu' : 'SEP ' + sep.value.status))
const tercetak = ref(false)
const jamCetak = ref('')
const detik = () => { const d = new Date(); return `${pad(d.getHours(), 2)}.${pad(d.getMinutes(), 2)}.${pad(d.getSeconds(), 2)}` }

onMounted(() => {
  if (!v.value) return navigateTo('/apm/menu')
  setTimeout(() => { tercetak.value = true; jamCetak.value = detik() }, 1200)
})
const cetak = () => {
  tercetak.value = false
  window.print()
  setTimeout(() => { tercetak.value = true; jamCetak.value = detik() }, 900)
}
const selesai = () => { apm.reset(); navigateTo('/apm') }
</script>
<template>
  <ApmShell kode="APM-07" langkah="Langkah 4 · Hasil & cetak antrean" :back="false">
    <template v-if="v">
      <h1 class="apm-h1">Pendaftaran berhasil</h1>
      <div class="cols apm-hasil">
        <div class="apm-card hasil">
          <p class="ok">{{ tercetak ? '✓ Tiket berhasil dicetak' : 'Mencetak tiket…' }}</p>
          <p class="t24 muted">Nomor antrean poli Anda</p>
          <p class="nomor">{{ v.antreanPoli.nomor }}</p>
          <p class="t28">Poli {{ pl?.nama }} · {{ dr?.nama }}</p>
          <p class="t24">{{ pl?.ruang }}</p>
          <p v-if="nomorLoket" class="t24">Nomor antrean loket: <b>{{ nomorLoket }}</b> · tunggu panggilan di loket pendaftaran</p>
          <p class="t24">Perkiraan dipanggil: {{ jamPanggil }} · sekitar {{ menit }} menit</p>
          <p class="t20">Kunjungan: {{ v.status }} · Antrean poli: {{ v.antreanPoli.status }}</p>
          <p v-if="sep" class="t20 warn">BPJS: {{ sepText }} · Simulasi VClaim</p>
          <p v-if="apm.state.value.baruRm" class="t20">No. RM baru Anda: <b>{{ apm.state.value.baruRm }}</b></p>
        </div>
        <div class="apm-card tiket">
          <p class="tk-h">PRATINJAU TIKET · 80 mm</p>
          <p class="t24b">RS SPKD</p>
          <p>{{ fmtTgl(v.jamDaftar) }} · {{ fmtJam(v.jamDaftar) }}</p>
          <p class="tk-no">{{ v.antreanPoli.nomor }}</p>
          <p v-if="nomorLoket">Loket {{ nomorLoket }}</p>
          <p class="t22b">Poli {{ pl?.nama }}</p>
          <p>{{ dr?.nama }}</p>
          <p>{{ pl?.ruang }}</p>
          <p>Estimasi {{ jamPanggil }}</p>
          <p>Simpan tiket ini hingga pelayanan selesai.</p>
          <p class="muted">{{ tercetak ? 'Cetak sukses · ' + jamCetak : 'Mencetak…' }}</p>
          <p v-if="v.kodeBooking">Kode booking {{ v.kodeBooking }}</p>
          <p v-else>No. RM {{ pt?.rm }}</p>
        </div>
      </div>
      <div class="apm-guide">{{ nomorLoket ? `Tunggu panggilan nomor ${nomorLoket} di loket pendaftaran, lalu menuju ruang tunggu Poli ${pl?.nama}.` : `Silakan menuju ruang tunggu Poli ${pl?.nama}.` }}{{ sep && sep.status !== 'terbit' ? ' Pendaftaran tetap tersimpan walaupun SEP masih menunggu.' : '' }}</div>
      <div class="apm-row no-print">
        <button type="button" class="apm-btn" @click="cetak">Cetak Karcis</button>
        <button type="button" class="apm-btn pri" @click="selesai">Selesai</button>
      </div>
      <p v-if="v.kodeBooking" class="t20">{{ v.viaMobileJkn ? 'Mobile JKN' : 'Reservasi' }} · Hadir · Task ID 3 tersimpan di outbox (simulasi BPJS)</p>
    </template>
  </ApmShell>
</template>
<style scoped>
.cols { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
.hasil { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
.hasil p, .tiket p { margin: 0; line-height: 1.45; }
.ok { font-size: 24px; font-weight: 600; color: #00747c; }
.t24 { font-size: 24px; color: #173348; } .t24.muted { color: #647887; }
.t28 { font-size: 28px; font-weight: 600; color: #173348; }
.t20 { font-size: 20px; color: #173348; } .t20.warn { color: #946017; }
.nomor { font-size: 112px; font-weight: 700; color: #06345d; line-height: 1 !important; }
.tiket { border-radius: 8px; padding: 28px; display: flex; flex-direction: column; gap: 20px; align-items: center; text-align: center; font-size: 20px; color: #173348; }
.tiket .muted { color: #647887; }
.tk-h { font-weight: 600; align-self: stretch; text-align: left; }
.t24b { font-size: 24px; font-weight: 600; }
.t22b { font-size: 22px; font-weight: 600; }
.tk-no { font-size: 60px; font-weight: 700; color: #06345d; line-height: 1 !important; }
@media (max-width: 899px) {
  .cols { grid-template-columns: minmax(0, 1fr); }
  .hasil { padding: 20px; gap: 12px; } .nomor { font-size: 72px; } .t28 { font-size: 20px; } .t24 { font-size: 18px; }
}
</style>
<style>
/* Cetak: hanya tiket 80 mm */
@media print {
  body:has(.apm-hasil) * { visibility: hidden !important; }
  body:has(.apm-hasil) .apm-hasil .tiket, body:has(.apm-hasil) .apm-hasil .tiket * { visibility: visible !important; }
  body:has(.apm-hasil) .apm-hasil .tiket { position: absolute; left: 0; top: 0; width: 80mm; max-width: 80mm; border: 0; padding: 4mm; margin: 0; gap: 2mm; font-size: 11px; }
  body:has(.apm-hasil) .apm-hasil .tk-no { font-size: 36px; }
}
@page { size: 80mm auto; margin: 0; }
</style>
