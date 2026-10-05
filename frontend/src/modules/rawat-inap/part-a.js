// Rawat inap bagian A: RI-01 s.d. RI-04
export default {
  nav: [
    { label: 'Bed board', to: '/rawat-inap/bed-board' },
    { label: 'Admisi', to: '/rawat-inap/admisi-ranap' },
    { label: 'Workspace', to: '/rawat-inap/workspace-ranap' },
    { label: 'Askep & IO', to: '/rawat-inap/askep-dan-io' },
  ],
  routes: [
    {
      path: 'bed-board',
      name: 'ri-bed-board',
      component: () => import('./views/BedBoard.vue'),
      meta: { title: 'Bed Board', code: 'RI-01' },
    },
    {
      path: 'admisi-ranap',
      name: 'ri-admisi-ranap',
      component: () => import('./views/AdmisiRanap.vue'),
      meta: { title: 'Admisi Ranap', code: 'RI-02' },
    },
    {
      path: 'workspace-ranap',
      name: 'ri-workspace-ranap',
      component: () => import('./views/WorkspaceRanap.vue'),
      meta: { title: 'Workspace Ranap', code: 'RI-03' },
    },
    {
      path: 'askep-dan-io',
      name: 'ri-askep-dan-io',
      component: () => import('./views/AskepIo.vue'),
      meta: { title: 'Askep & IO', code: 'RI-04' },
    },
  ],
}
