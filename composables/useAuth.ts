import type { Role } from './useDb'

export const ROLE_LABEL: Record<Role, string> = {
  fo: 'Front Office / Admin',
  dokter: 'Dokter / Perawat',
  kasir: 'Kasir',
  mgmt: 'Management RS',
  it: 'IT / Superadmin',
}
export const ROLE_SHORT: Record<Role, string> = { fo: 'FO / FRONT OFFICE / ADMIN', dokter: 'DOKTER / PERAWAT', kasir: 'KASIR', mgmt: 'MANAGEMENT RS', it: 'IT / SUPERADMIN' }

export interface NavItem { label: string; to: string; icon: string }
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
    { label: 'Worklist poli', to: '/klinis', icon: 'stethoscope' },
    { label: 'Data pasien', to: '/pasien', icon: 'users' },
  ],
  kasir: [
    { label: 'Beranda', to: '/', icon: 'home' },
    { label: 'Worklist tagihan', to: '/kasir', icon: 'grid' },
    { label: 'Pembayaran', to: '/kasir/pembayaran', icon: 'clipboard' },
    { label: 'Invoice & kwitansi', to: '/kasir/invoice', icon: 'users' },
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
  it: [
    { label: 'Beranda', to: '/', icon: 'home' },
    { label: 'User & role', to: '/it/user', icon: 'users' },
    { label: 'Master poli & dokter', to: '/it/poli', icon: 'building' },
    { label: 'Master jadwal', to: '/it/jadwal', icon: 'calendar' },
    { label: 'Master tarif', to: '/it/tarif', icon: 'tag' },
    { label: 'Status integrasi', to: '/it/integrasi', icon: 'activity' },
    { label: 'Audit trail', to: '/it/audit', icon: 'shield' },
    { label: 'Perangkat', to: '/it/perangkat', icon: 'monitor' },
  ],
}

/** Awalan rute → role yang boleh membuka (IT boleh semuanya: mode baca untuk troubleshooting). */
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
  ['/it/audit', ['it', 'mgmt']],
  ['/it', ['it']],
]
export const canAccess = (role: Role | undefined, path: string) => {
  if (!role) return false
  if (role === 'it') return true
  if (path === '/') return true
  const rule = ACCESS.find(([p]) => path === p || path.startsWith(p + '/'))
  return !rule || rule[1].includes(role)
}

let _user: Ref<any> | null = null
export function useAuth() {
  if (!_user) {
    _user = ref(null)
    if (import.meta.client) {
      try { _user.value = JSON.parse(localStorage.getItem('spkd-session') || 'null') } catch {}
    }
  }
  const user = _user
  const login = (username: string, password: string) => {
    const { db } = useDb()
    const u = db.users.find((x: any) => x.username === username.trim().toLowerCase())
    if (!u || u.password !== password) {
      db.audit.unshift({ id: Date.now() + 'f', at: new Date().toISOString(), user: username || '-', role: '-', aksi: 'login gagal', objek: username, alasan: 'kredensial salah', ip: '10.10.1.20' })
      throw new Error('Username atau password salah')
    }
    if (!u.aktif) {
      db.audit.unshift({ id: Date.now() + 'x', at: new Date().toISOString(), user: u.nama, role: u.role, aksi: 'login ditolak', objek: u.username, alasan: 'role tidak aktif', ip: '10.10.1.20' })
      throw new Error('Akun tidak aktif. Hubungi IT.')
    }
    u.loginTerakhir = new Date().toISOString()
    _user!.value = { id: u.id, nama: u.nama, username: u.username, role: u.role, unit: u.unit, poliId: u.poliId, doctorId: u.doctorId }
    localStorage.setItem('spkd-session', JSON.stringify(_user!.value))
    db.audit.unshift({ id: Date.now() + 'l', at: new Date().toISOString(), user: u.nama, role: u.role, aksi: 'login', objek: 'GL-01', alasan: '', ip: '10.10.1.20' })
    return _user!.value
  }
  const logout = () => {
    _user!.value = null
    localStorage.removeItem('spkd-session')
    navigateTo('/login')
  }
  return { user, login, logout, nav: computed(() => (user.value ? NAV[user.value.role as Role] : [])) }
}
