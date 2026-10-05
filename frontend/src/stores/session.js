import { defineStore } from 'pinia'

/** Sesi login (mock). Nanti diganti autentikasi backend Go + RBAC. */
export const useSessionStore = defineStore('session', {
  state: () => {
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem('spkd.session') || 'null')
    } catch {
      saved = null
    }
    return { user: saved }
  },
  getters: {
    isLoggedIn: (s) => !!s.user,
    displayName: (s) => s.user?.name ?? 'Tamu',
  },
  actions: {
    login(username) {
      this.user = { username, name: username === 'andi.spjp' ? 'dr. Andi' : username, role: 'Dokter' }
      try {
        localStorage.setItem('spkd.session', JSON.stringify(this.user))
      } catch {
        /* storage tidak tersedia — sesi hanya di memori */
      }
    },
    logout() {
      this.user = null
      try {
        localStorage.removeItem('spkd.session')
      } catch {
        /* abaikan */
      }
    },
  },
})
