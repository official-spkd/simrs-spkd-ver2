// IGD-01 s.d. IGD-05 — menu & route modul IGD
export default {
  nav: [
    { label: 'Tracking board', to: '/igd/tracking-board' },
    { label: 'Triase', to: '/igd/form-triase' },
    { label: 'CPPT IGD', to: '/igd/cppt-igd' },
    { label: 'Resusitasi', to: '/igd/tindakan-resusitasi' },
    { label: 'Outcome', to: '/igd/outcome-igd' },
  ],
  routes: [
    {
      path: 'tracking-board',
      name: 'igd-tracking-board',
      component: () => import('./views/TrackingBoard.vue'),
      meta: { title: 'Tracking Board', code: 'IGD-01' },
    },
    {
      path: 'form-triase',
      name: 'igd-form-triase',
      component: () => import('./views/FormTriase.vue'),
      meta: { title: 'Form Triase', code: 'IGD-02' },
    },
    {
      path: 'cppt-igd',
      name: 'igd-cppt-igd',
      component: () => import('./views/CpptIgd.vue'),
      meta: { title: 'CPPT IGD', code: 'IGD-03' },
    },
    {
      path: 'tindakan-resusitasi',
      name: 'igd-tindakan-resusitasi',
      component: () => import('./views/TindakanResusitasi.vue'),
      meta: { title: 'Tindakan / Resusitasi', code: 'IGD-04' },
    },
    {
      path: 'outcome-igd',
      name: 'igd-outcome-igd',
      component: () => import('./views/OutcomeIgd.vue'),
      meta: { title: 'Outcome IGD', code: 'IGD-05' },
    },
  ],
}
