import { House, CalendarDays, Activity, UserRound } from 'lucide-vue-next'
import partA from './part-a.js'
import partB from './part-b.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'pasien-app',
  label: 'ePasien (mobile)',
  group: 'Aplikasi',
  order: 210,
  layout: 'mobile',
  basePath: '/m/pasien',
  nav: [...partA.nav, ...partB.nav],
  tabs: [
    { label: 'Beranda', icon: House, to: '/m/pasien/beranda' },
    { label: 'Booking', icon: CalendarDays, to: '/m/pasien/booking-kunjungan' },
    { label: 'Antrean', icon: Activity, to: '/m/pasien/antrean-live' },
    { label: 'Profil', icon: UserRound, to: '/m/pasien/profil-saya' },
  ],
  routes: [...partA.routes, ...partB.routes],
}
