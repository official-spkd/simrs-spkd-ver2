<script setup lang="ts">
// GL-01 Login
definePageMeta({ layout: 'blank' })
const { user, login } = useAuth()
const { db } = useDb()
const toast = useToast()
const username = ref('')
const password = ref('')
const error = ref('')
const showForgot = ref(false)
const dbOk = ref(true)
const ssOk = computed(() => db.integrasi.satuSehat.status === 'online')
const demo = [
  { u: 'fo', l: 'Front Office' }, { u: 'dokter', l: 'Dokter/Perawat' }, { u: 'kasir', l: 'Kasir' },
  { u: 'manajemen', l: 'Manajemen' }, { u: 'it', l: 'IT/Superadmin' },
]
onMounted(() => { if (user.value) navigateTo('/') })
const masuk = () => {
  error.value = ''
  try {
    login(username.value, password.value)
    navigateTo('/')
  } catch (e: any) { error.value = e.message }
}
const isi = (u: string) => { username.value = u; password.value = 'demo123' }
</script>

<template>
  <div class="login-wrap">
    <form class="login-card stack" style="gap: 18px" @submit.prevent="masuk">
      <div class="row" style="gap: 12px">
        <div class="brand-mark" style="background: var(--teal-l); width: 52px; height: 52px">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0b8f95" stroke-width="2.4" stroke-linecap="round"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
        </div>
        <div><h1 style="font-size: 24px">SIMRS SPKD</h1><div class="muted small">Sistem Informasi Manajemen Rumah Sakit</div></div>
      </div>
      <div class="row" style="gap: 8px">
        <span class="badge" :class="dbOk ? 'b-ok' : 'b-err'"><span class="dot" style="margin-right: 6px" />Database {{ dbOk ? 'terhubung' : 'terputus' }}</span>
        <span class="badge" :class="ssOk ? 'b-ok' : 'b-err'"><span class="dot" style="margin-right: 6px" />Satu Sehat {{ ssOk ? 'terhubung' : 'terputus' }}</span>
      </div>
      <div class="field"><label for="u" class="req">Username</label><input id="u" v-model="username" class="input" autocomplete="username" autofocus /></div>
      <div class="field"><label for="p" class="req">Password</label><input id="p" v-model="password" class="input" type="password" autocomplete="current-password" /></div>
      <p v-if="error" class="alert err" role="alert">{{ error }}</p>
      <button class="btn btn-primary btn-lg btn-block" type="submit" :disabled="!username || !password">Masuk</button>
      <button type="button" class="btn btn-ghost btn-sm" style="align-self: center" @click="showForgot = true">Lupa password?</button>
      <div>
        <div class="small muted">Akun demo (password: <b>demo123</b>)</div>
        <div class="demo-acc"><button v-for="d in demo" :key="d.u" type="button" class="btn btn-sm" @click="isi(d.u)">{{ d.l }}</button></div>
        <div class="small muted" style="margin-top: 10px">Perangkat publik: <NuxtLink to="/apm" target="_blank">APM</NuxtLink> · <NuxtLink to="/vwr/loket" target="_blank">Display Loket</NuxtLink> · <NuxtLink to="/vwr/poli" target="_blank">Display Poli</NuxtLink></div>
      </div>
    </form>
    <AppModal v-model="showForgot" title="Lupa password">
      <p>Reset password dilakukan oleh tim IT / Superadmin. Hubungi IT melalui ekstensi 101, atau minta reset dari menu IT-01 User &amp; Role.</p>
      <template #footer><button class="btn btn-primary" @click="showForgot = false">Mengerti</button></template>
    </AppModal>
    <ToastHost />
  </div>
</template>
