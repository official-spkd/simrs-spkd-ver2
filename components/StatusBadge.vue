<script setup lang="ts">
// Pewarnaan seragam untuk semua status (kunjungan, antrean, SEP, tagihan, Satu Sehat, reservasi, tiket, penjamin, kanal).
const props = defineProps<{ value: string | null | undefined }>()
const MAP: Record<string, string> = {
  terdaftar: 'b-navy', dilayani: 'b-teal', selesai: 'b-ok', lunas: 'b-ok', dibatalkan: 'b-err',
  menunggu: 'b-warn', dipanggil: 'b-teal', 'vital selesai': 'b-ok', diperiksa: 'b-teal', dilewati: 'b-mute',
  terbit: 'b-ok', ditolak: 'b-err', 'gagal kirim': 'b-err', gagal: 'b-err',
  antrian: 'b-warn', terkirim: 'b-ok',
  booked: 'b-info', 'check-in': 'b-ok', batal: 'b-err', 'no-show': 'b-mute',
  draf: 'b-warn', final: 'b-info',
  online: 'b-ok', offline: 'b-err', stub: 'b-warn', ditunda: 'b-mute', aktif: 'b-ok', nonaktif: 'b-mute',
  Umum: 'b-mute', BPJS: 'b-ok', Asuransi: 'b-info',
  loket: 'b-navy', apm: 'b-teal', reservasi: 'b-info',
}
const cls = computed(() => MAP[props.value || ''] || 'b-mute')
</script>
<template><span class="badge" :class="cls">{{ value || '-' }}</span></template>
