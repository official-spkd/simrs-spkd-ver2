/**
 * Klien HTTP untuk backend Go (belum tersambung).
 * Selama VITE_USE_MOCK=true, layar memakai data mock dari src/modules/<modul>/data.js.
 * Saat backend siap, ganti impor data mock di masing-masing view dengan pemanggilan api.get(...).
 */
const BASE = import.meta.env.VITE_API_BASE_URL || '/api'
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.status === 204 ? null : res.json()
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
}
