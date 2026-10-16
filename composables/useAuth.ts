import type { Role } from './useDb'

export const ROLE_LABEL: Record<Role, string> = {
  fo: 'Front Office / Admin',
  dokter: 'Dokter / Perawat',
  kasir: 'Kasir',
  mgmt: 'Management RS',
  it: 'IT',
  superadmin: 'IT / Superadmin',
}
export const ROLE_SHORT: Record<Role, string> = { fo: 'FO / FRONT OFFICE / ADMIN', dokter: 'KL / DOKTER / PERAWAT', kasir: 'KS / KASIR', mgmt: 'MANAGEMENT RS', it: 'IT / IT', superadmin: 'IT / IT / SUPERADMIN' }

/** `match`: regex path tambahan agar item tetap aktif di halaman turunan (mis. /klinis/:id → Workspace pasien).
 *  `crumb`: judul halaman di breadcrumb bila berbeda dari label menu. */
export interface NavItem { label: string; to: string; icon: string; match?: string; crumb?: string }
// Menu IT (Figma GL-02 Beranda IT / Superadmin). User & role hanya superadmin: /api/v1/users & /roles khusus superadmin.
const NAV_IT: NavItem[] = [
  { label: 'Poli & dokter', to: '/it/poli', icon: 'clipboard', crumb: 'Master Poli & Dokter' },
  { label: 'Jadwal & kuota', to: '/it/jadwal', icon: 'users', crumb: 'Master Jadwal & Kuota' },
  { label: 'Tarif & penjamin', to: '/it/tarif', icon: 'calendar', crumb: 'Master Tarif & Penjamin' },
  { label: 'Status integrasi', to: '/it/integrasi', icon: 'activity', crumb: 'Status Integrasi & Antrian Kirim' },
  { label: 'Audit trail', to: '/it/audit', icon: 'shield-check', crumb: 'Audit Trail' },
  { label: 'Perangkat terdaftar', to: '/it/perangkat', icon: 'monitor', crumb: 'Perangkat Terdaftar' },
  { label: 'Mapping HFIS BPJS & Antrol V2', to: '/it/mapping', icon: 'clipboard', crumb: 'Mapping HFIS BPJS & Antrol V2' },
]
export const NAV: Record<Role, NavItem[]> = {
  fo: [
    { label: 'Beranda', to: '/', icon: 'home' },
    { label: 'Pendaftaran', to: '/fo', icon: 'clipboard' },
    { label: 'Data pasien', to: '/pasien', icon: 'users' },
    { label: 'Antrean loket', to: '/fo/antrean', icon: 'megaphone' },
    { label: 'Reservasi', to: '/fo/reservasi', icon: 'calendar' },
    { label: 'Jadwal & kuota', to: '/fo/jadwal', icon: 'grid' },
    { label: 'Monitor poli', to: '/monitor', icon: 'monitor' },
  ],
  dokter: [
    { label: 'Beranda', to: '/', icon: 'home' },
    { label: 'Worklist poli', to: '/klinis', icon: 'grid' },
    { label: 'Workspace pasien', to: '/klinis/workspace', icon: 'clipboard', match: '^/klinis/(?!riwayat$)[^/]+$' },
    { label: 'Riwayat kunjungan', to: '/klinis/riwayat', icon: 'users' },
    { label: 'Data pasien · baca', to: '/pasien', icon: 'calendar' },
  ],
  kasir: [
    { label: 'Beranda', to: '/', icon: 'home' },
    { label: 'Worklist tagihan', to: '/kasir', icon: 'grid', match: '^/kasir/(?!shift$|bayar$|invoice$)[^/]+$' },
    { label: 'Pembayaran', to: '/kasir/bayar', icon: 'clipboard', match: '^/kasir/[^/]+/bayar$' },
    { label: 'Invoice & kwitansi', to: '/kasir/invoice', icon: 'users', match: '^/kasir/[^/]+/invoice$' },
    { label: 'Rekap shift', to: '/kasir/shift', icon: 'calendar' },
    { label: 'Data pasien · baca', to: '/pasien', icon: 'activity' },
  ],
  mgmt: [
    { label: 'Beranda', to: '/', icon: 'home' },
    { label: 'Dashboard', to: '/manajemen', icon: 'chart' },
    { label: 'Lap. kunjungan', to: '/manajemen/kunjungan', icon: 'file' },
    { label: 'Lap. pembatalan', to: '/manajemen/pembatalan', icon: 'ban' },
    { label: 'Monitor poli', to: '/monitor', icon: 'monitor' },
    { label: 'Rekap shift', to: '/kasir/shift', icon: 'wallet' },
    { label: 'Audit trail', to: '/it/audit', icon: 'shield' },
  ],
  it: [{ label: 'Beranda', to: '/', icon: 'grid' }, ...NAV_IT],
  superadmin: [{ label: 'Beranda', to: '/', icon: 'grid' }, { label: 'User & role', to: '/it/user', icon: 'grid', crumb: 'User & Role (RBAC)' }, ...NAV_IT],
}

/** Awalan rute → role yang boleh membuka. Superadmin boleh semuanya; IT juga, kecuali rute khusus superadmin. */
export const ACCESS: [string, Role[]][] = [
  ['/fo', ['fo']],
  ['/kunjungan', ['fo']],
  ['/pasien/baru', ['fo']],
  ['/pasien', ['fo', 'dokter', 'kasir']],
  ['/klinis', ['dokter']],
  ['/kasir/shift', ['kasir', 'mgmt']],
  ['/kasir', ['kasir']],
  ['/manajemen', ['mgmt']],
  ['/monitor', ['fo', 'mgmt']],
  ['/it/user', ['superadmin']],
  ['/it/audit', ['it', 'mgmt']],
  ['/it', ['it']],
]
export const canAccess = (role: Role | undefined, path: string) => {
  if (!role) return false
  if (role === 'superadmin' || path === '/') return true
  const rule = ACCESS.find(([p]) => path === p || path.startsWith(p + '/'))
  if (role === 'it') return !rule || rule[1].some((r) => r !== 'superadmin')
  return !rule || rule[1].includes(role)
}

/** Role bawaan backend (lihat Swagger: roles.Role) → role menu frontend. Role di luar daftar ini tidak bisa masuk. */
export const BACKEND_ROLE: Record<string, Role> = {
  superadmin: 'superadmin',
  it: 'it',
  front_office: 'fo',
  doctor: 'dokter',
  cashier: 'kasir',
  management: 'mgmt',
}

const SESSION_KEY = 'spkd-session'

const toSession = (u: any, expiresAt: number) => ({
  id: u.id,
  nama: u.name,
  username: u.nip || u.email,
  nip: u.nip,
  email: u.email,
  backendRole: u.role,
  role: BACKEND_ROLE[u.role],
  expiresAt,
})

const clearStorage = () => {
  try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(TOKEN_KEY) } catch {}
}

let _user: Ref<any> | null = null
export function useAuth() {
  if (!_user) {
    _user = ref(null)
    if (import.meta.client) {
      try {
        const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
        if (s && localStorage.getItem(TOKEN_KEY) && s.expiresAt > Date.now()) _user.value = s
        else clearStorage()
      } catch {}
      // Validasi ulang token ke server; akun yang dinonaktifkan/role berubah ikut terbarui.
      if (_user.value) {
        api('/api/v1/auth/me')
          .then((u: any) => {
            if (!u?.is_active || !BACKEND_ROLE[u.role]) return logout()
            _user!.value = toSession(u, _user!.value.expiresAt)
            localStorage.setItem(SESSION_KEY, JSON.stringify(_user!.value))
          })
          .catch((e) => { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) logout() })
      }
    }
  }
  const user = _user

  const audit = (nama: string, role: string, aksi: string, objek: string, alasan = '') => {
    const { db } = useDb()
    db.audit.unshift({ id: Date.now() + aksi, at: new Date().toISOString(), user: nama, role, aksi, objek, alasan, ip: '-' })
  }

  const login = async (identifier: string, password: string) => {
    const id = identifier.trim()
    let res: any
    try {
      res = await api('/api/v1/auth/login', { method: 'POST', body: { identifier: id, password } })
    } catch (e: any) {
      if (e instanceof ApiError && e.status) audit(id || '-', '-', e.status === 403 ? 'login ditolak' : 'login gagal', id, e.message)
      throw e
    }
    const role = BACKEND_ROLE[res.user.role]
    if (!role) {
      audit(res.user.name, res.user.role, 'login ditolak', id, 'role belum didukung frontend')
      throw new Error(`Role "${res.user.role}" belum memiliki akses ke aplikasi ini. Hubungi IT.`)
    }
    _user!.value = toSession(res.user, Date.now() + res.expires_in * 1000)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(_user!.value))
    audit(res.user.name, role, 'login', 'GL-01')
    return _user!.value
  }

  function logout() {
    _user!.value = null
    clearStorage()
    navigateTo('/login')
  }

  return { user, login, logout, nav: computed(() => (user.value ? NAV[user.value.role as Role] : [])) }
}
