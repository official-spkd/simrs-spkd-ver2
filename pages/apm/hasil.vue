<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { db, visit, poli, doctor, patientOf } = useDb()

const v = computed(() => (apm.state.value.visitId ? visit(apm.state.value.visitId) : null))
const pl = computed(() => (v.value ? poli(v.value.poliId) : null))
const dr = computed(() => (v.value ? doctor(v.value.doctorId) : null))
const pt = computed(() => (v.value ? patientOf(v.value) : null))
const depan = computed(() => {
  if (!v.value) return 0
  return db.visits.filter((x: any) => x.poliId === v.value.poliId && x.tanggal === v.value.tanggal && x.status !== 'dibatalkan' && x.antreanPoli.status === 'menunggu' && x.jamDaftar < v.value.jamDaftar).length
})
const estimasi = computed(() => depan.value * 8)
const tercetak = ref(false)
const sep = computed(() => v.value?.sep || null)
const namaSamar = computed(() => (pt.value ? maskNama(pt.value.nama) : ''))
const waktu = computed(() => (v.value ? fmtWaktu(v.value.jamDaftar) : ''))
const estText = computed(() => (estimasi.value === 0 ? 'Segera' : `± ${estimasi.value} menit lagi`))
const sepText = computed(() => (sep.value ? (sep.value.status === 'terbit' ? 'SEP terbit' : sep.value.status === 'menunggu' ? 'SEP menunggu' : 'SEP ' + sep.value.status) : ''))

onMounted(() => {
  if (!v.value) return navigateTo('/apm/menu')
  setTimeout(() => (tercetak.value = true), 1200)
})
const cetak = () => {
  tercetak.value = false
  window.print()
  setTimeout(() => (tercetak.value = true), 900)
}
const selesai = () => {
  apm.reset()
  navigateTo('/apm')
}
</script>
<template>
  <ApmShell kode="APM-07" langkah="Langkah 5 · Nomor antrean Anda">
    <div v-if="v" class="apm-hasil">
      <div class="cols">
        <div class="card big">
          <p class="lead">Nomor antrean poli Anda</p>
          <div class="nomor">{{ v.antreanPoli.nomor }}</div>
          <dl>
            <dt>Poli</dt><dd>{{ pl?.nama }}</dd>
            <dt>Dokter</dt><dd>{{ dr?.nama }}</dd>
            <dt>Ruang</dt><dd>{{ pl?.ruang }}</dd>
            <dt>Perkiraan dipanggil</dt><dd>{{ estText }}<span v-if="depan > 0" class="muted"> ({{ depan }} antrean di depan)</span></dd>
          </dl>
          <div class="row stat">
            <span class="badge" :class="tercetak ? 'b-ok' : 'b-warn'">{{ tercetak ? 'Tiket tercetak' : 'Mencetak tiket...' }}</span>
            <span v-if="sep" class="badge" :class="sep.status === 'terbit' ? 'b-ok' : 'b-warn'">{{ sepText }}</span>
          </div>
          <p v-if="sep && sep.status === 'menunggu'" class="hint">SEP BPJS sedang diproses otomatis. Anda tetap dapat menuju poli.</p>
          <p class="hint">Silakan menuju {{ pl?.ruang }} dan perhatikan layar antrean. Nomor Anda akan dipanggil.</p>
        </div>
        <div class="tcol">
          <div class="ticket">
            <b>RS SPKD</b>
            <div>Rawat Jalan · Pendaftaran Mandiri</div>
            <div>{{ waktu }}</div>
            <div class="no">{{ v.antreanPoli.nomor }}</div>
            <div><b>{{ pl?.nama }}</b></div>
            <div>{{ dr?.nama }}</div>
            <div>{{ pl?.ruang }}</div>
            <hr />
            <div>{{ namaSamar }} · {{ pt?.rm }}</div>
            <div>{{ v.noKunjungan }}</div>
            <div>Penjamin: {{ v.penjamin }}<template v-if="sep"> · {{ sepText }}</template></div>
            <div>Perkiraan panggil: {{ estText }}</div>
            <hr />
            <div>Terima kasih. Harap menunggu di ruang tunggu.</div>
          </div>
        </div>
      </div>
      <div class="row act no-print">
        <button class="btn" @click="cetak">Cetak ulang</button>
        <button class="btn btn-primary go" @click="selesai">Selesai</button>
      </div>
    </div>
  </ApmShell>
</template>
<style scoped>
.cols { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.big { padding: 32px; text-align: center; }
.lead { font-size: 22px; color: var(--muted); }
.nomor { font-size: clamp(72px, 12vw, 150px); font-weight: 800; color: var(--teal-d); line-height: 1.05; letter-spacing: 4px; margin: 8px 0 20px; }
dl { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 10px 16px; text-align: left; font-size: 22px; margin: 0 0 16px; }
dt { color: var(--muted); }
dd { margin: 0; font-weight: 600; }
.stat { justify-content: center; gap: 10px; margin-bottom: 8px; }
.stat .badge { font-size: 16px; padding: 4px 12px; }
.act { justify-content: space-between; margin-top: 24px; }
.go { min-width: 260px; }
.tcol .ticket { font-size: 14px; display: flex; flex-direction: column; gap: 3px; }
.ticket hr { border: 0; border-top: 1px dashed #8aa; margin: 6px 0; width: 100%; }
@media (max-width: 899px) { .cols { grid-template-columns: minmax(0, 1fr); } dl { grid-template-columns: minmax(0, 1fr); gap: 0; font-size: 18px; } dd { margin-bottom: 8px; } .big { padding: 20px; } }
</style>
<style>
/* Cetak: hanya tiket 80 mm */
@media print {
  body:has(.apm-hasil) * { visibility: hidden !important; }
  body:has(.apm-hasil) .apm-hasil .ticket, body:has(.apm-hasil) .apm-hasil .ticket * { visibility: visible !important; }
  body:has(.apm-hasil) .apm-hasil .ticket { position: absolute; left: 0; top: 0; width: 80mm; max-width: 80mm; border: 0; padding: 4mm; margin: 0; }
}
@page { size: 80mm auto; margin: 0; }
</style>
