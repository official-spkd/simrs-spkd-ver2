// RAD-01 s.d. RAD-05 — menu & route modul Radiologi
export default {
  nav: [
    { label: 'Worklist modality', to: '/radiologi/worklist-modality' },
    { label: 'Pemeriksaan', to: '/radiologi/proses-pemeriksaan' },
    { label: 'Viewer', to: '/radiologi/viewer-radiologi' },
    { label: 'Reporting', to: '/radiologi/reporting' },
    { label: 'Sign & publish', to: '/radiologi/sign-dan-publish' },
  ],
  routes: [
    {
      path: 'worklist-modality',
      name: 'rad-worklist-modality',
      component: () => import('./views/WorklistModality.vue'),
      meta: { title: 'Worklist Modality', code: 'RAD-01' },
    },
    {
      path: 'proses-pemeriksaan',
      name: 'rad-proses-pemeriksaan',
      component: () => import('./views/ProsesPemeriksaan.vue'),
      meta: { title: 'Proses Pemeriksaan', code: 'RAD-02' },
    },
    {
      path: 'viewer-radiologi',
      name: 'rad-viewer-radiologi',
      component: () => import('./views/ViewerRadiologi.vue'),
      meta: { title: 'Viewer Radiologi', code: 'RAD-03' },
    },
    {
      path: 'reporting',
      name: 'rad-reporting',
      component: () => import('./views/Reporting.vue'),
      meta: { title: 'Reporting', code: 'RAD-04' },
    },
    {
      path: 'sign-dan-publish',
      name: 'rad-sign-dan-publish',
      component: () => import('./views/SignDanPublish.vue'),
      meta: { title: 'Sign & Publish', code: 'RAD-05' },
    },
  ],
}
