// Master data bagian B — MD-06..MD-10 (ruang & bed, tarif, obat & KFA, terminologi, hak akses)
export default {
  nav: [
    { label: 'Ruang & bed', to: '/master-data/bed-master' },
    { label: 'Tarif', to: '/master-data/master-tarif' },
    { label: 'Obat & KFA', to: '/master-data/master-obat-dan-kfa' },
    { label: 'Terminologi', to: '/master-data/terminologi-sync' },
    { label: 'Hak akses', to: '/master-data/rbac-matrix' },
  ],
  routes: [
    {
      path: 'bed-master',
      name: 'md-bed-master',
      component: () => import('./views/BedMaster.vue'),
      meta: { title: 'Peta Ruang — Bed Master', code: 'MD-06' },
    },
    {
      path: 'master-tarif',
      name: 'md-master-tarif',
      component: () => import('./views/MasterTarif.vue'),
      meta: { title: 'Master Tarif', code: 'MD-07' },
    },
    {
      path: 'master-obat-dan-kfa',
      name: 'md-master-obat-dan-kfa',
      component: () => import('./views/MasterObatKfa.vue'),
      meta: { title: 'Master Obat & KFA', code: 'MD-08' },
    },
    {
      path: 'terminologi-sync',
      name: 'md-terminologi-sync',
      component: () => import('./views/TerminologiSync.vue'),
      meta: { title: 'Terminologi Sync', code: 'MD-09' },
    },
    {
      path: 'rbac-matrix',
      name: 'md-rbac-matrix',
      component: () => import('./views/RbacMatrix.vue'),
      meta: { title: 'RBAC Matrix', code: 'MD-10' },
    },
  ],
}
