import { createRouter, createWebHistory } from 'vue-router'
import { modules } from '@/modules/registry'
import { useSessionStore } from '@/stores/session'
import AppShell from '@/layouts/AppShell.vue'
import KioskLayout from '@/layouts/KioskLayout.vue'
import MobileLayout from '@/layouts/MobileLayout.vue'

const layouts = { desktop: AppShell, kiosk: KioskLayout, mobile: MobileLayout }

// Kiosk & aplikasi pasien dapat diakses tanpa login staf.
const PUBLIC_LAYOUTS = new Set(['kiosk', 'mobile'])

const moduleRoutes = modules
  .filter((m) => m.routes?.length)
  .map((m) => {
    const layout = m.layout ?? 'desktop'
    const first = m.routes[0].path
    return {
      path: m.basePath,
      component: layouts[layout],
      meta: { module: m.key, layout, public: PUBLIC_LAYOUTS.has(layout) },
      redirect: first ? `${m.basePath}/${first}` : undefined,
      children: m.routes,
    }
  })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true, title: 'Masuk' } },
    ...moduleRoutes,
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true, title: 'Tidak ditemukan' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (!to.meta.public && !session.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.name === 'login' && session.isLoggedIn) return '/beranda'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · SIMRS SPKD` : 'SIMRS SPKD'
})

export default router
