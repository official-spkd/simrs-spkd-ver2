export default {
  key: 'operasional',
  label: 'Operasional',
  group: 'Operasional & klinis',
  order: 0,
  layout: 'desktop',
  basePath: '/beranda',
  persona: 'Ns. Maya',
  nav: [
    { label: 'Ringkasan operasional', to: '/beranda' },
    { label: 'Pendaftaran', to: '/pendaftaran' },
    { label: 'Rawat jalan', to: '/rawat-jalan' },
    { label: 'IGD', to: '/igd' },
    { label: 'Rawat inap', to: '/rawat-inap' },
    { label: 'Farmasi', to: '/farmasi' },
    { label: 'Penunjang', to: '/laboratorium' },
    { label: 'Keuangan', to: '/billing' },
  ],
  routes: [
    {
      path: '',
      name: 'beranda',
      component: () => import('./views/BerandaOperasional.vue'),
      meta: { title: 'Beranda operasional', code: 'SHL-02' },
    },
  ],
}
