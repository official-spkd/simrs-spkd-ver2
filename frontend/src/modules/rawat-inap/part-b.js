// Rawat inap bagian B: RI-05 s.d. RI-07
export default {
  nav: [
    { label: 'Instruksi medis', to: '/rawat-inap/instruksi-medis' },
    { label: 'Resume pulang', to: '/rawat-inap/resume-pulang' },
    { label: 'MPP', to: '/rawat-inap/mpp-dashboard' },
  ],
  routes: [
    {
      path: 'instruksi-medis',
      name: 'ri-instruksi-medis',
      component: () => import('./views/InstruksiMedis.vue'),
      meta: { title: 'Instruksi Medis', code: 'RI-05' },
    },
    {
      path: 'resume-pulang',
      name: 'ri-resume-pulang',
      component: () => import('./views/ResumePulang.vue'),
      meta: { title: 'Resume Pulang', code: 'RI-06' },
    },
    {
      path: 'mpp-dashboard',
      name: 'ri-mpp-dashboard',
      component: () => import('./views/MppDashboard.vue'),
      meta: { title: 'MPP Dashboard', code: 'RI-07' },
    },
  ],
}
