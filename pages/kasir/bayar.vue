<script setup lang="ts">
// Menu "Pembayaran": buka tagihan final yang menunggu bayar (terakhir dibuka, atau final paling awal).
const { db } = useDb()
const cari = ref(true)
onMounted(() => {
  let last = ''
  try { last = localStorage.getItem(KS_AKTIF_KEY) || '' } catch {}
  const final = Object.values(db.bills).filter((b: any) => b.status === 'final').sort((a: any, b: any) => (a.finalAt > b.finalAt ? 1 : -1)) as any[]
  const pilih = (last && db.bills[last]?.status === 'final' ? last : '') || final[0]?.visitId
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
        <h2>Tidak ada tagihan yang menunggu pembayaran</h2>
        <p class="muted">Finalkan tagihan kunjungan selesai di Worklist Tagihan untuk menerbitkan INV, lalu lanjutkan pembayaran.</p>
        <div><NuxtLink to="/kasir" class="btn btn-primary">Buka Worklist Tagihan</NuxtLink></div>
      </template>
    </div>
  </div>
</template>
