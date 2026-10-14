const PUBLIC = ['/login', '/apm', '/vwr']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (PUBLIC.some((p) => to.path === p || to.path.startsWith(p + '/'))) return
  const { user, logout } = useAuth()
  if (!user.value) return navigateTo('/login')
  if (user.value.expiresAt <= Date.now()) return logout()
  if (!canAccess(user.value.role, to.path)) return navigateTo('/')
})
