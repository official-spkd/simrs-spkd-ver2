<script setup lang="ts">
// Panel "Status sistem" beranda per role (GL-02): display VWR, ringkasan kirim Satu Sehat, BPJS simulasi.
const { db } = useDb()
const vwr = computed(() => db.devices.find((d: any) => d.tipe === 'Display'))
const ss = computed(() => {
  const o = db.outbox.filter((x: any) => x.modul === 'Satu Sehat')
  return { terkirim: o.filter((x: any) => x.status === 'terkirim').length, antrian: o.filter((x: any) => x.status === 'antrian').length, gagal: o.filter((x: any) => x.status === 'gagal').length }
})
</script>
<template>
  <div class="panel">
    <h2>Status sistem</h2>
    <div class="kl-actions">
      <span class="badge" :class="vwr?.online ? 'b-ok' : 'b-err'">● {{ vwr?.nama || 'Display' }} {{ vwr?.online ? 'terhubung' : 'terputus' }}</span>
      <span class="badge" :class="ss.gagal ? 'b-warn' : 'b-ok'">Satu Sehat: {{ ss.terkirim }} terkirim · {{ ss.antrian }} antrian · {{ ss.gagal }} gagal</span>
      <span class="badge b-navy">BPJS VClaim / Antrol · simulasi</span>
    </div>
    <p class="muted">Gangguan integrasi tidak menghalangi pelayanan. Data tersimpan lokal; petugas tetap dapat melanjutkan pekerjaan.</p>
  </div>
</template>
