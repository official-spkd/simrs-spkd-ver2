// Klien HTTP ke backend Go (go_backend_simrs_spkd). Semua respons berbentuk { success, message, data }.
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

const PESAN: Record<string, string> = {
  'invalid credentials': 'NIP/email atau password salah',
  'account is deactivated': 'Akun tidak aktif. Hubungi IT.',
  'invalid or expired token': 'Sesi berakhir. Silakan masuk kembali.',
  'insufficient permissions': 'Anda tidak memiliki akses untuk aksi ini',
}

export const TOKEN_KEY = 'spkd-token'

type ApiOpts = { method?: string; body?: any; query?: Record<string, any> }

export interface Pagination {
  current_page: number; items_per_page: number; total_items: number; total_pages: number
  has_prev_page: boolean; has_next_page: boolean
}

export async function api<T = any>(path: string, opts: ApiOpts = {}): Promise<T> {
  return (await request(path, opts))?.data as T
}

/** Untuk endpoint list: { data, pagination }. */
export async function apiPage<T = any>(path: string, opts: ApiOpts = {}): Promise<{ data: T[]; pagination: Pagination }> {
  const res = await request(path, opts)
  return { data: res?.data || [], pagination: res?.pagination }
}

async function request(path: string, opts: ApiOpts): Promise<any> {
  const base = useRuntimeConfig().public.apiBase as string
  let token: string | null = null
  try { token = localStorage.getItem(TOKEN_KEY) } catch {}
  // Buang parameter kosong supaya tidak terkirim sebagai ?gender=&payer=
  const query = opts.query && Object.fromEntries(Object.entries(opts.query).filter(([, v]) => v !== '' && v != null))
  try {
    return await $fetch(path, {
      baseURL: base,
      method: (opts.method || 'GET') as any,
      body: opts.body,
      query,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch (e: any) {
    const status = e?.response?.status ?? 0
    const raw = e?.data?.message as string | undefined
    if (!status) throw new ApiError('Server tidak dapat dihubungi. Periksa koneksi jaringan.', 0)
    throw new ApiError((raw && PESAN[raw]) || raw || `Permintaan gagal (${status})`, status)
  }
}
