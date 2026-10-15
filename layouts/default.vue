<script setup lang="ts">
// GL-02 App Shell: sidebar dinamis per role, omnibox (Ctrl+K), notifikasi, badge Satu Sehat, profil.
import logo from '~/assets/images/logo-sidebar.png'
const { user, logout, nav } = useAuth()
const { db, flushOutbox } = useDb()
const route = useRoute()
const open = ref(false)
const searchOpen = ref(false)
const notifOpen = ref(false)
const q = ref('')

const unread = computed(() => db.notifications.filter((n: any) => !n.dibaca).length)
const ssOk = computed(() => db.integrasi.satuSehat.status === 'online')
const canSearch = computed(() => ['fo', 'dokter', 'kasir', 'it', 'superadmin'].includes(user.value?.role))
const roleLabel = computed(() => (user.value ? ROLE_LABEL[user.value.role as Role] : ''))
// Dokter / Perawat: unit aktif = poli penugasan dokter akun
const { poliAktif } = useDokterQueue()
const unitAktif = computed(() => user.value?.unit || (user.value?.role === 'dokter' && poliAktif.value ? 'Poli ' + poliAktif.value.nama : ''))
const navAktif = (n: NavItem) => !!n.match && new RegExp(n.match).test(route.path)

watch(() => route.fullPath, () => { open.value = false; notifOpen.value = false })
const openSearch = () => { if (canSearch.value) { searchOpen.value = true } }
let timer: any
onMounted(() => {
  const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch() } }
  window.addEventListener('keydown', f)
  timer = setInterval(flushOutbox, 5000)
  // master poli & dokter dari server → db.polis / db.doctors (dropdown pendaftaran, jadwal); gagal = tetap pakai salinan lokal.
  // Dokter setelah poli karena poli dokter dipetakan lewat db.polis.
  if (user.value) usePolis().refresh().then(() => useDoctors().refresh()).catch(() => {})
  onBeforeUnmount(() => { window.removeEventListener('keydown', f); clearInterval(timer) })
})
const crumbs = computed(() => {
  const cur = nav.value.find((n) => n.to === route.path) || nav.value.find(navAktif) || [...nav.value].reverse().find((n) => n.to !== '/' && route.path.startsWith(n.to))
  // Dokter / Perawat: format breadcrumb sesuai Figma (Rawat jalan / Dokter / Perawat / Halaman)
  if (user.value?.role === 'dokter') return ['Rawat jalan', 'Dokter / Perawat', cur?.label || 'Halaman']
  return ['Rawat jalan', cur?.label || 'Halaman']
})
const readAll = () => { db.notifications.forEach((n: any) => (n.dibaca = true)) }
</script>

<template>
  <div v-if="user" class="shell" :class="{ open }">
    <aside class="sidebar" aria-label="Menu utama">
      <div class="brand"><img :src="logo" alt="SIMRS SPKD" width="125" height="48" /></div>
      <div class="role-tag">{{ ROLE_SHORT[user.role as Role] }}</div>
      <nav class="nav">
        <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" :exact="n.to === '/'" :class="{ 'router-link-active': navAktif(n) }"><AppIcon :name="n.icon" /> {{ n.label }}</NuxtLink>
      </nav>
      <div class="unit-card">
        <small>UNIT AKTIF</small>
        <b>{{ unitAktif }}</b>
        {{ fmtTglPanjang() }}
      </div>
      <div class="side-foot">Lingkungan demo<br />Data pasien fiktif</div>
    </aside>
    <div class="scrim" @click="open = false" />
    <div class="main">
      <header class="topbar">
        <button class="burger" aria-label="Buka menu" @click="open = !open"><AppIcon name="menu" :size="24" /></button>
        <div v-if="canSearch" class="omnibox"><input v-model="q" placeholder="Cari NIK / RM / nama" readonly @focus="openSearch" @click="openSearch" /><kbd>Ctrl+K</kbd></div>
        <button v-if="canSearch" class="btn btn-sm omnibox-m" aria-label="Cari pasien" @click="openSearch"><AppIcon name="search" /></button>
        <span class="chip-ss" :class="{ bad: !ssOk }"><span class="dot" /> Satu Sehat {{ ssOk ? 'terhubung' : 'terputus' }}</span>
        <div class="top-spacer" />
        <button class="bell" aria-label="Notifikasi" @click="notifOpen = !notifOpen"><AppIcon name="bell" :size="22" /><i v-if="unread">{{ unread }}</i></button>
        <div class="profile"><b>{{ user.nama }}</b><span class="muted">{{ roleLabel }}</span></div>
        <button class="logout" @click="logout">Keluar</button>
        <div v-if="notifOpen" class="notif-pop">
          <div class="row between"><b>Notifikasi</b><button class="btn btn-sm btn-ghost" @click="readAll">Tandai dibaca</button></div>
          <ul><li v-for="n in db.notifications" :key="n.id" :style="{ opacity: n.dibaca ? 0.55 : 1 }">{{ n.teks }}<div class="muted small">{{ fmtWaktu(n.at) }}</div></li><li v-if="!db.notifications.length" class="muted">Tidak ada notifikasi</li></ul>
        </div>
      </header>
      <main class="content">
        <div class="crumbs"><span v-for="c in crumbs" :key="c">{{ c }}</span></div>
        <slot />
      </main>
      <footer class="footer"><span>SIMRS SPKD · MVP Rawat Jalan · Data demo fiktif</span><span><span class="dot" style="color: var(--ok)" /> Database lokal tersimpan · Pelayanan tetap berjalan</span></footer>
    </div>
    <PatientSearchModal v-model="searchOpen" />
    <ToastHost />
  </div>
</template>
