<script setup>
/** SHL-01 · Global — Login */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Hospital, LogIn, CreditCard, Fingerprint } from 'lucide-vue-next'
import { UiButton, UiAlert, FormField } from '@/components/ui'
import { useSessionStore } from '@/stores/session'
import heroImg from '@/assets/img/login-hero.jpg'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()

const username = ref('andi.spjp')
const password = ref('')
const remember = ref(true)
const error = ref('')

function submit() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Username dan password wajib diisi.'
    return
  }
  session.login(username.value.trim())
  router.push(route.query.redirect || '/beranda')
}
</script>

<template>
  <div class="login">
    <section class="login__brand">
      <div class="login__logo">
        <Hospital aria-hidden="true" />
        <span>SIMRS SPKD</span>
      </div>
      <div class="login__pitch">
        <span class="badge badge--primary">Satu sistem. Pelayanan terhubung.</span>
        <h1>Fokus pada pasien. Kami hubungkan sisanya.</h1>
        <p>Dari pendaftaran sampai tindak lanjut, setiap informasi membantu tim memberikan pelayanan yang lebih baik.</p>
      </div>
      <img class="login__hero" :src="heroImg" alt="Perawat melayani pasien di meja pendaftaran" />
      <p class="login__tag">Aman · Terintegrasi · Berpusat pada pasien</p>
    </section>

    <section class="login__form-wrap">
      <form class="login__form" @submit.prevent="submit">
        <p class="t-sm t-strong t-primary">SHL-01 · AKSES STAF</p>
        <div class="stack-sm">
          <h2 class="login__title">Selamat datang kembali</h2>
          <p class="t-body t-muted">Masuk menggunakan akun rumah sakit Anda.</p>
        </div>

        <FormField label="Username" required>
          <input v-model="username" class="input" autocomplete="username" />
        </FormField>
        <FormField label="Password" required :error="error">
          <input v-model="password" class="input" type="password" autocomplete="current-password" placeholder="••••••••••••" />
        </FormField>

        <div class="row t-sm">
          <label class="check grow"><input v-model="remember" type="checkbox" /> Ingat perangkat ini</label>
          <a href="#" class="grow" @click.prevent>Lupa password?</a>
        </div>

        <div><UiButton type="submit" variant="primary" size="lg" :icon="LogIn">Masuk</UiButton></div>

        <p class="t-sm t-muted t-center">atau gunakan akses aman</p>
        <div class="row">
          <UiButton :icon="CreditCard">Kartu pintar</UiButton>
          <UiButton :icon="Fingerprint">Sidik jari</UiButton>
        </div>

        <UiAlert tone="success" title="Sistem siap digunakan" text="Database terhubung · Satu Sehat terhubung" />

        <p class="t-xs t-muted">
          v1.0.0 · Koneksi terenkripsi · Akses tercatat di audit trail. Jangan bagikan password atau PIN tanda tangan Anda.
        </p>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login { display: flex; min-height: 100vh; background: #fff; }
.login__brand {
  width: 760px;
  max-width: 53%;
  flex-shrink: 0;
  background: var(--c-navy);
  color: #fff;
  padding: 64px;
  display: flex;
  flex-direction: column;
  gap: 36px;
}
.login__logo { display: flex; align-items: center; gap: 16px; font-size: 24px; font-weight: 600; }
.login__logo svg { width: 40px; height: 40px; stroke-width: 1.5; }
.login__pitch { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.login__pitch h1 { font-size: 48px; line-height: 1.45; }
.login__pitch p { font-size: 17px; color: var(--c-navy-muted); }
.login__hero { width: 100%; height: 380px; object-fit: cover; border-radius: var(--r-lg); }
.login__tag { font-size: 12px; color: var(--c-navy-muted); }
.login__form-wrap { flex: 1; min-width: 0; padding: 140px 80px; }
.login__form { display: flex; flex-direction: column; gap: 24px; max-width: 520px; }
.login__title { font-size: 32px; }

@media (max-width: 960px) {
  .login { flex-direction: column; }
  .login__brand { width: 100%; max-width: none; padding: 32px 16px; gap: 20px; }
  .login__pitch h1 { font-size: 30px; }
  .login__hero { height: 200px; }
  .login__form-wrap { padding: 32px 16px 48px; }
}
</style>
