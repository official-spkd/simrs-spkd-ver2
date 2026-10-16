<script setup lang="ts">
// Menu "Pembayaran": buka tagihan final yang menunggu bayar (terakhir dibuka, atau final paling awal).
const cari = ref(true)
const galat = ref('')
onMounted(async () => {
  let last = ''
  try { last = localStorage.getItem(KS_AKTIF_KEY) || '' } catch {}
  let final: any[] = []
  try {
    final = (await kasirApi.dokumen('', 'final')).sort((a: any, b: any) => ((a.b.finalAt || '') > (b.b.finalAt || '') ? 1 : -1))
  } catch (e: any) {
    galat.value = pesanKasir(e)
  }
  const pilih = (last && final.some((r: any) => r.id === last) ? last : '') || final[0]?.id
  if (pilih) return navigateTo(`/kasir/${pilih}/bayar`, { replace: true })
  cari.value = false
})
</script>
<template>
  <div>
    <PageHead code="KS-03" role="Kasir" title="Pembayaran" subtitle="Pembayaran dibuka melalui tagihan yang sudah difinalkan (INV)." />
    <div class="panel">
      <p v-if="cari" class="muted">Membuka tagihan…</p>
      <template v-else>
        <div v-if="galat" class="guide warn">{{ galat }}</div>
        <h2>Tidak ada tagihan yang menunggu pembayaran</h2>
        <p class="muted">Finalkan tagihan kunjungan selesai di Worklist Tagihan untuk menerbitkan INV, lalu lanjutkan pembayaran.</p>
        <div><NuxtLink to="/kasir" class="btn btn-primary">Buka Worklist Tagihan</NuxtLink></div>
      </template>
    </div>
  </div>
</template>
