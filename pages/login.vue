<script setup lang="ts">
// GL-01 Login
import logo from '~/assets/images/logo.svg'
definePageMeta({ layout: 'blank' })
const { user, login } = useAuth()
const { db } = useDb()
const username = ref('')
const password = ref('')
const showPw = ref(false)
const error = ref('')
const showForgot = ref(false)
const dbOk = ref(true)
const ssOk = computed(() => db.integrasi.satuSehat.status === 'online')
const loading = ref(false)
onMounted(async () => {
  if (user.value) return navigateTo('/')
  try {
    await $fetch('/ping', { baseURL: useRuntimeConfig().public.apiBase as string })
    dbOk.value = true
  } catch { dbOk.value = false }
})
const masuk = async () => {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    navigateTo('/')
  } catch (e: any) { error.value = e.message } finally { loading.value = false }
}
</script>

<template>
  <div class="login-wrap">
    <!-- Panel kiri: brand -->
    <aside class="login-brand">
      <div>
        <div class="login-logo"><img :src="logo" alt="SIMRS SPKD" /></div>
        <p class="login-eyebrow">SIMRS SPKD / RAWAT JALAN</p>
      </div>
      <div>
        <h1>Pelayanan terhubung.<br />Perawatan tetap<br />berjalan.</h1>
        <p class="login-lead">Satu ruang kerja untuk pendaftaran, pelayanan poliklinik, dan pembayaran rawat jalan.</p>
        <div class="login-flow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" /></svg>
          <b>Pendaftaran → Poliklinik → Kasir</b>
        </div>
      </div>
      <div class="login-note">
        <p>Akses khusus petugas rumah sakit.</p>
        <p>Tidak tersedia untuk perangkat publik.</p>
      </div>
    </aside>

    <!-- Panel kanan: form -->
    <main class="login-main">
      <form class="login-card stack" style="gap: 12px" @submit.prevent="masuk">
        <img :src="logo" alt="SIMRS SPKD" class="login-logo-sm" />
        <div>
          <div class="login-kicker">GL-01 · AKSES PETUGAS</div>
          <h2 style="font-size: 20px">Selamat datang kembali</h2>
          <p class="muted small" style="margin-top: 2px">Masuk menggunakan akun yang diberikan oleh IT.</p>
        </div>
        <div class="field"><label for="u" class="req">NIP atau email</label><input id="u" v-model="username" class="input" autocomplete="username" placeholder="mis. 198001012010011001" autofocus /></div>
        <div class="field">
          <label for="p" class="req">Password</label>
          <div class="pw-wrap">
            <input id="p" v-model="password" class="input" :type="showPw ? 'text' : 'password'" autocomplete="current-password" />
            <button type="button" class="pw-toggle" :aria-label="showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPw = !showPw">
              <svg v-if="showPw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6" /><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" /></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8-10-8-10-8Z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="alert err" role="alert">{{ error }}</p>
        <button class="btn btn-primary btn-block" type="submit" :disabled="!username || !password || loading">{{ loading ? 'Memproses…' : 'Masuk' }}</button>
        <div class="row" style="justify-content: space-between; flex-wrap: wrap; gap: 6px">
          <button type="button" class="login-link" @click="showForgot = true">Lupa password?</button>
          <div class="login-status">
            <span :class="dbOk ? 'on' : 'off'"><span class="dot" />Server {{ dbOk ? 'terhubung' : 'terputus' }}</span>
            <span :class="ssOk ? 'on' : 'off'"><span class="dot" />Satu Sehat {{ ssOk ? 'terhubung' : 'terputus' }}</span>
          </div>
        </div>
        <div class="alert info login-audit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink: 0; margin-top: 2px" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span>Setiap login dicatat dalam audit keamanan: pengguna, waktu, dan IP. Akun/role nonaktif tidak dapat masuk.</span>
        </div>
        <div>
          <div class="muted" style="font-size: 12px">Perangkat publik: <NuxtLink to="/apm" target="_blank">APM</NuxtLink> · <NuxtLink to="/vwr/loket" target="_blank">Display Loket</NuxtLink> · <NuxtLink to="/vwr/poli" target="_blank">Display Poli</NuxtLink></div>
        </div>
      </form>
    </main>
    <AppModal v-model="showForgot" title="Lupa password">
      <p>Reset password dilakukan oleh tim IT / Superadmin. Hubungi IT melalui ekstensi 101, atau minta reset dari menu IT-01 User &amp; Role.</p>
      <template #footer><button class="btn btn-primary" @click="showForgot = false">Mengerti</button></template>
    </AppModal>
  </div>
</template>
