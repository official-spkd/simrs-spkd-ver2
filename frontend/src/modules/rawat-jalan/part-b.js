// Rawat jalan bagian B: RJ-05 s.d. RJ-08
export default {
  nav: [
    { label: 'Order & resep', to: '/rawat-jalan/order-terpadu' },
    { label: 'Hasil penunjang', to: '/rawat-jalan/hasil-penunjang' },
    { label: 'Surat', to: '/rawat-jalan/surat-center' },
  ],
  routes: [
    {
      path: 'order-terpadu',
      name: 'rj-order-terpadu',
      component: () => import('./views/OrderTerpadu.vue'),
      meta: { title: 'Order Terpadu', code: 'RJ-05' },
    },
    {
      path: 'hasil-penunjang',
      name: 'rj-hasil-penunjang',
      component: () => import('./views/HasilPenunjang.vue'),
      meta: { title: 'Hasil Penunjang', code: 'RJ-06' },
    },
    {
      path: 'tutup-kunjungan',
      name: 'rj-tutup-kunjungan',
      component: () => import('./views/TutupKunjungan.vue'),
      meta: { title: 'Tutup Kunjungan', code: 'RJ-07' },
    },
    {
      path: 'surat-center',
      name: 'rj-surat-center',
      component: () => import('./views/SuratCenter.vue'),
      meta: { title: 'Surat Center', code: 'RJ-08' },
    },
  ],
}
