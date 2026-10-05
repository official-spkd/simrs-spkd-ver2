// Master data bagian A — MD-01..MD-05 (beranda, pasien, nakes)
export default {
  nav: [
    { label: 'Beranda Master', to: '/master-data/beranda-master' },
    { label: 'Pasien', to: '/master-data/daftar-pasien' },
    { label: 'Tenaga kesehatan', to: '/master-data/daftar-nakes' },
  ],
  routes: [
    {
      path: 'beranda-master',
      name: 'md-beranda-master',
      component: () => import('./views/BerandaMaster.vue'),
      meta: { title: 'Beranda Master', code: 'MD-01' },
    },
    {
      path: 'daftar-pasien',
      name: 'md-daftar-pasien',
      component: () => import('./views/DaftarPasien.vue'),
      meta: { title: 'Daftar Pasien', code: 'MD-02' },
    },
    {
      path: 'detail-pasien',
      name: 'md-detail-pasien',
      component: () => import('./views/DetailPasien.vue'),
      meta: { title: 'Detail Pasien', code: 'MD-03' },
    },
    {
      path: 'daftar-nakes',
      name: 'md-daftar-nakes',
      component: () => import('./views/DaftarNakes.vue'),
      meta: { title: 'Daftar Nakes', code: 'MD-04' },
    },
    {
      path: 'detail-nakes',
      name: 'md-detail-nakes',
      component: () => import('./views/DetailNakes.vue'),
      meta: { title: 'Detail Nakes', code: 'MD-05' },
    },
  ],
}
