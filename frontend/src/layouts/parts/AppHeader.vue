<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { allPages } from '@/modules/registry'

const props = defineProps({ persona: { type: String, default: '' } })

const router = useRouter()
const session = useSessionStore()
const userName = computed(() => props.persona || session.displayName)

/* ---- Omnibox (Ctrl+K) ---- */
const q = ref('')
const omniOpen = ref(false)
const omniInput = ref(null)
const results = computed(() => {
  const s = q.value.trim().toLowerCase()
  const list = s
    ? allPages.filter((p) => `${p.title} ${p.module} ${p.code}`.toLowerCase().includes(s))
    : allPages
  return list.slice(0, 8)
})
function go(p) {
  router.push(p.to)
  q.value = ''
  omniOpen.value = false
  omniInput.value?.blur()
}
function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    omniInput.value?.focus()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

/* ---- Notifikasi & menu pengguna ---- */
const notifOpen = ref(false)
const userOpen = ref(false)
const notifs = [
  { tone: 'danger', title: 'Hb kritis · Rina Pertiwi', text: '5,8 g/dL · 09:08 WIB', to: '/laboratorium' },
  { tone: 'warning', title: '6 resep perlu telaah', text: 'Farmasi rawat jalan', to: '/farmasi' },
  { tone: 'danger', title: '14 pesan gagal terkirim', text: 'Integration Hub · tinjau DLQ', to: '/integration-hub' },
]
function logout() {
  session.logout()
  router.push('/')
}
</script>

<template>
  <header class="hdr no-print">
    <div class="hdr__brand">
      <slot name="lead" />
      <RouterLink to="/beranda" class="hdr__logo">✚ SIMRS SPKD</RouterLink>
    </div>

    <div class="hdr__omni" @focusout="omniOpen = false">
      <span aria-hidden="true">⌕</span>
      <input
        ref="omniInput"
        v-model="q"
        type="search"
        placeholder="Cari pasien, dokumen, menu"
        aria-label="Cari pasien, dokumen, menu"
        @focus="omniOpen = true"
        @keydown.enter="results[0] && go(results[0])"
        @keydown.esc="omniInput?.blur()"
      />
      <kbd>Ctrl+K</kbd>
      <ul v-if="omniOpen && results.length" class="hdr__pop hdr__results">
        <li v-for="p in results" :key="p.to">
          <button @mousedown.prevent="go(p)">
            <span class="t-strong">{{ p.title }}</span>
            <span class="t-xs t-muted">{{ p.module }}<template v-if="p.code"> · {{ p.code }}</template></span>
          </button>
        </li>
      </ul>
    </div>

    <span class="badge badge--success hdr__status">● Satu Sehat terhubung</span>

    <div class="hdr__menu">
      <button class="hdr__btn" :aria-expanded="notifOpen" @click="notifOpen = !notifOpen; userOpen = false">Notifikasi ③</button>
      <div v-if="notifOpen" class="hdr__pop hdr__notif" @click="notifOpen = false">
        <RouterLink v-for="n in notifs" :key="n.title" :to="n.to" class="hdr__notif-item" :class="`is-${n.tone}`">
          <span class="t-strong">{{ n.title }}</span>
          <span class="t-xs">{{ n.text }}</span>
        </RouterLink>
      </div>
    </div>

    <div class="hdr__menu">
      <button class="hdr__btn t-strong" :aria-expanded="userOpen" @click="userOpen = !userOpen; notifOpen = false">{{ userName }} ▾</button>
      <div v-if="userOpen" class="hdr__pop hdr__user">
        <RouterLink to="/beranda" @click="userOpen = false">Beranda operasional</RouterLink>
        <RouterLink to="/m/pasien" @click="userOpen = false">Aplikasi pasien (mobile)</RouterLink>
        <RouterLink to="/m/dokter" @click="userOpen = false">Aplikasi dokter (mobile)</RouterLink>
        <RouterLink to="/kiosk" @click="userOpen = false">Anjungan mandiri (kiosk)</RouterLink>
        <button @click="logout">Keluar</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--header-h);
  background: var(--c-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid var(--c-border);
}
.hdr__brand { display: flex; align-items: center; gap: 8px; width: 196px; flex-shrink: 0; }
.hdr__logo { font-size: 18px; font-weight: 600; color: var(--c-primary); white-space: nowrap; }
.hdr__omni {
  position: relative;
  width: 460px;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  border-radius: var(--r-sm);
  background: var(--c-bg);
  color: var(--c-muted);
  font-size: 12px;
}
.hdr__omni input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font-size: 12px; color: var(--c-text); }
.hdr__omni input::placeholder { color: var(--c-muted); }
.hdr__omni kbd { font-family: inherit; font-size: 11px; }
.hdr__omni:focus-within { box-shadow: 0 0 0 2px var(--c-primary-soft); background: #fff; outline: 1px solid var(--c-primary); }
.hdr__btn { background: none; border: 0; font-size: 13px; color: var(--c-text); white-space: nowrap; padding: 6px 4px; }
.hdr__menu { position: relative; }
.hdr__pop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-pop);
  padding: 8px;
  z-index: 60;
  min-width: 240px;
}
.hdr__results { left: 0; right: 0; list-style: none; margin: 0; }
.hdr__results button {
  width: 100%;
  background: none;
  border: 0;
  text-align: left;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  display: flex;
  flex-direction: column;
  font-size: 13px;
}
.hdr__results button:hover { background: var(--c-primary-soft); }
.hdr__notif { width: 320px; display: flex; flex-direction: column; gap: 6px; }
.hdr__notif-item { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: var(--r-sm); font-size: 13px; }
.hdr__notif-item.is-danger { background: var(--c-danger-soft); color: var(--c-danger); }
.hdr__notif-item.is-warning { background: var(--c-warning-soft); color: var(--c-warning); }
.hdr__user { display: flex; flex-direction: column; }
.hdr__user a,
.hdr__user button {
  background: none;
  border: 0;
  text-align: left;
  padding: 9px 10px;
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--c-text);
}
.hdr__user a:hover,
.hdr__user button:hover { background: var(--c-bg); }
.hdr__user button { color: var(--c-danger); }

@media (max-width: 1100px) {
  .hdr { padding: 0 16px; }
  .hdr__brand { width: auto; }
  .hdr__omni { width: auto; flex: 1; }
  .hdr__status { display: none; }
}
@media (max-width: 640px) {
  .hdr__omni kbd,
  .hdr__menu:first-of-type { display: none; }
}
</style>
