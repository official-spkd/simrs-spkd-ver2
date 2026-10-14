// RME bagian A: RME-01 s.d. RME-04
export default {
  nav: [
    { label: 'Timeline pasien', to: '/rme/timeline-pasien' },
    { label: 'Dokumen', to: '/rme/document-viewer' },
    { label: 'Consent', to: '/rme/consent-center' },
    { label: 'Kelengkapan', to: '/rme/kelengkapan-rme' },
  ],
  routes: [
    {
      path: 'timeline-pasien',
      name: 'rme-timeline-pasien',
      component: () => import('./views/TimelinePasien.vue'),
      meta: { title: 'Timeline Pasien', code: 'RME-01' },
    },
    {
      path: 'document-viewer',
      name: 'rme-document-viewer',
      component: () => import('./views/DocumentViewer.vue'),
      meta: { title: 'Document Viewer', code: 'RME-02' },
    },
    {
      path: 'consent-center',
      name: 'rme-consent-center',
      component: () => import('./views/ConsentCenter.vue'),
      meta: { title: 'Consent Center', code: 'RME-03' },
    },
    {
      path: 'kelengkapan-rme',
      name: 'rme-kelengkapan-rme',
      component: () => import('./views/KelengkapanRme.vue'),
      meta: { title: 'Kelengkapan RME', code: 'RME-04' },
    },
  ],
}
