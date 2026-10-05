// Pendaftaran bagian B — PDR-05 s.d. PDR-08
export default {
  nav: [
    { label: 'BPJS & SEP', to: '/pendaftaran/panel-bpjs' },
    { label: 'Antrean poli', to: '/pendaftaran/monitor-antrean-poli' },
    { label: 'Jadwal dokter', to: '/pendaftaran/jadwal-dokter' },
    { label: 'Booking', to: '/pendaftaran/daftar-booking' },
  ],
  routes: [
    {
      path: 'panel-bpjs',
      name: 'pdr-panel-bpjs',
      component: () => import('./views/PanelBpjs.vue'),
      meta: { title: 'Panel BPJS', code: 'PDR-05' },
    },
    {
      path: 'monitor-antrean-poli',
      name: 'pdr-monitor-antrean-poli',
      component: () => import('./views/MonitorAntreanPoli.vue'),
      meta: { title: 'Monitor Antrean Poli', code: 'PDR-06' },
    },
    {
      path: 'jadwal-dokter',
      name: 'pdr-jadwal-dokter',
      component: () => import('./views/JadwalDokter.vue'),
      meta: { title: 'Jadwal Dokter', code: 'PDR-07' },
    },
    {
      path: 'daftar-booking',
      name: 'pdr-daftar-booking',
      component: () => import('./views/DaftarBooking.vue'),
      meta: { title: 'Daftar Booking', code: 'PDR-08' },
    },
  ],
}
