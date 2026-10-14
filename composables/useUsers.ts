// Manajemen akun & role di backend (/api/v1/users, /api/v1/roles) — khusus superadmin.

export interface ApiUser { id: string; name: string; nip: string; email: string; role: string; is_active: boolean; created_at: string; updated_at?: string }
export interface ApiRole { id: string; name: string; display_name: string; description: string; is_system: boolean }

/** Password sementara 12 karakter tanpa huruf yang mirip (0/O, 1/l/I). */
export const tempPassword = () => {
  const cs = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const buf = new Uint32Array(12)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => cs[n % cs.length]).join('')
}

export function useUsers() {
  const list = (q: { search?: string; role?: string; status?: string; page?: number; limit?: number }) =>
    apiPage<ApiUser>('/api/v1/users', {
      query: { search: q.search?.trim(), role: q.role, is_active: q.status === '' ? '' : q.status === 'aktif', page: q.page || 1, limit: q.limit || 20 },
    })
  const create = (f: { name: string; nip: string; email: string; password: string; role: string }) =>
    api<ApiUser>('/api/v1/auth/register', { method: 'POST', body: f })
  const update = (id: string, f: { name: string; nip: string; email: string }) =>
    api<ApiUser>(`/api/v1/users/${id}`, { method: 'PUT', body: f })
  const setRole = (id: string, role: string) => api<ApiUser>(`/api/v1/users/${id}/role`, { method: 'PATCH', body: { role } })
  const setStatus = (id: string, isActive: boolean) => api<ApiUser>(`/api/v1/users/${id}/status`, { method: 'PATCH', body: { is_active: isActive } })
  const resetPassword = (id: string, newPassword: string) => api(`/api/v1/users/${id}/password`, { method: 'PUT', body: { new_password: newPassword } })
  const remove = (id: string) => api(`/api/v1/users/${id}`, { method: 'DELETE' })

  const roles = () => api<ApiRole[]>('/api/v1/roles')
  const createRole = (f: { name: string; display_name: string; description: string }) => api<ApiRole>('/api/v1/roles', { method: 'POST', body: f })
  const updateRole = (id: string, f: { display_name: string; description: string }) => api<ApiRole>(`/api/v1/roles/${id}`, { method: 'PUT', body: f })
  const removeRole = (id: string) => api(`/api/v1/roles/${id}`, { method: 'DELETE' })

  return { list, create, update, setRole, setStatus, resetPassword, remove, roles, createRole, updateRole, removeRole }
}
