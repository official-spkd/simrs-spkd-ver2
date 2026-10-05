// Rawat jalan bagian A: RJ-01 s.d. RJ-04
export default {
  nav: [
    { label: 'Worklist poli', to: '/rawat-jalan/worklist-poli' },
    { label: 'Workspace pasien', to: '/rawat-jalan/workspace-pasien' },
    { label: 'Penilaian', to: '/rawat-jalan/penilaian-keperawatan' },
    { label: 'CPPT', to: '/rawat-jalan/cppt-editor' },
  ],
  routes: [
    {
      path: 'worklist-poli',
      name: 'rj-worklist-poli',
      component: () => import('./views/WorklistPoli.vue'),
      meta: { title: 'Worklist Poli', code: 'RJ-01' },
    },
    {
      path: 'workspace-pasien',
      name: 'rj-workspace-pasien',
      component: () => import('./views/WorkspacePasien.vue'),
      meta: { title: 'Workspace Pasien', code: 'RJ-02' },
    },
    {
      path: 'penilaian-keperawatan',
      name: 'rj-penilaian-keperawatan',
      component: () => import('./views/PenilaianKeperawatan.vue'),
      meta: { title: 'Penilaian Keperawatan', code: 'RJ-03' },
    },
    {
      path: 'cppt-editor',
      name: 'rj-cppt-editor',
      component: () => import('./views/CpptEditor.vue'),
      meta: { title: 'CPPT Editor', code: 'RJ-04' },
    },
  ],
}
