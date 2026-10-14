const PUBLIC = ['/login', '/apm', '/vwr']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (PUBLIC.some((p) => to.path === p || to.path.startsWith(p + '/'))) return
  const { user } = useAuth()
  if (!user.value) return navigateTo('/login')
  if (!canAccess(user.value.role, to.path)) return navigateTo('/')
})
