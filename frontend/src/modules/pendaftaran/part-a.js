// Pendaftaran bagian A — PDR-01 s.d. PDR-04
export default {
  nav: [
    { label: 'Worklist', to: '/pendaftaran/worklist-pendaftaran' },
    { label: 'Pasien baru', to: '/pendaftaran/form-pasien-baru' },
    { label: 'Kunjungan', to: '/pendaftaran/form-kunjungan' },
  ],
  routes: [
    {
      path: 'worklist-pendaftaran',
      name: 'pdr-worklist-pendaftaran',
      component: () => import('./views/WorklistPendaftaran.vue'),
      meta: { title: 'Worklist Pendaftaran', code: 'PDR-01' },
    },
    {
      path: 'cari-pasien',
      name: 'pdr-cari-pasien',
      component: () => import('./views/CariPasien.vue'),
      meta: { title: 'Cari Pasien', code: 'PDR-02' },
    },
    {
      path: 'form-pasien-baru',
      name: 'pdr-form-pasien-baru',
      component: () => import('./views/FormPasienBaru.vue'),
      meta: { title: 'Form Pasien Baru', code: 'PDR-03' },
    },
    {
      path: 'form-kunjungan',
      name: 'pdr-form-kunjungan',
      component: () => import('./views/FormKunjungan.vue'),
      meta: { title: 'Form Kunjungan', code: 'PDR-04' },
    },
  ],
}
