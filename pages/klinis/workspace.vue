<script setup lang="ts">
// Menu "Workspace pasien": buka workspace pasien aktif (terakhir dibuka, atau yang sedang dilayani).
const { visit } = useDb()
const { isDokter, sync, rows } = useDokterQueue()
const cari = ref(true)

onMounted(async () => {
  let last = ''
  try { last = localStorage.getItem(KL_AKTIF_KEY) || '' } catch {}
  const v = last ? visit(last) : null
  if (v && v.status !== 'dibatalkan') return navigateTo('/klinis/' + v.id, { replace: true })
  if (isDokter.value) await sync()
  const pilih = rows.value.find((x: any) => x.status === 'dilayani') || rows.value.find((x: any) => x.status === 'terdaftar')
  if (pilih) return navigateTo('/klinis/' + pilih.id, { replace: true })
  cari.value = false
})
</script>

<template>
  <div>
    <PageHead code="KL-02" role="Dokter / Perawat" title="Workspace Pasien" subtitle="Ringkasan episode klinis · Data tersimpan lokal sebelum dikirim ke Satu Sehat" />
    <div class="panel">
      <template v-if="cari"><p class="muted">Membuka pasien aktif…</p></template>
      <template v-else>
        <h2>Belum ada pasien aktif</h2>
        <p class="muted">Workspace dibuka melalui pasien aktif sesuai penugasan poli. Pilih pasien dari Worklist Poli.</p>
        <div><NuxtLink to="/klinis" class="btn btn-primary">Buka Worklist Poli</NuxtLink></div>
      </template>
    </div>
  </div>
</template>
