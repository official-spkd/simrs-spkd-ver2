// Bagian B anjungan mandiri: pilih tujuan, check-in, pembayaran, pasien baru. Kiosk tanpa sidebar.
export default {
  nav: [],
  routes: [
    {
      path: 'pilih-tujuan',
      name: 'ksk-pilih-tujuan',
      component: () => import('./views/PilihTujuan.vue'),
      meta: { title: 'Pilih tujuan', code: 'KSK-05' },
    },
    {
      path: 'check-in-berhasil',
      name: 'ksk-check-in-berhasil',
      component: () => import('./views/CheckInBerhasil.vue'),
      meta: { title: 'Check-in berhasil', code: 'KSK-06' },
    },
    {
      path: 'pembayaran',
      name: 'ksk-pembayaran',
      component: () => import('./views/Pembayaran.vue'),
      meta: { title: 'Pembayaran', code: 'KSK-07' },
    },
    {
      path: 'pasien-baru',
      name: 'ksk-pasien-baru',
      component: () => import('./views/PasienBaru.vue'),
      meta: { title: 'Pasien baru', code: 'KSK-08' },
    },
  ],
}
