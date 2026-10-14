// FRS-01 s.d. FRS-05 — menu & route modul Farmasi
export default {
  nav: [
    { label: 'Resep board', to: '/farmasi/resep-board' },
    { label: 'Telaah', to: '/farmasi/telaah-resep' },
    { label: 'Komposisi', to: '/farmasi/komposisi-obat' },
    { label: 'Serah terima', to: '/farmasi/serah-terima' },
    { label: 'Stok', to: '/farmasi/stok-dan-kartu-persediaan' },
  ],
  routes: [
    {
      path: 'resep-board',
      name: 'frs-resep-board',
      component: () => import('./views/ResepBoard.vue'),
      meta: { title: 'Resep Board', code: 'FRS-01' },
    },
    {
      path: 'telaah-resep',
      name: 'frs-telaah-resep',
      component: () => import('./views/TelaahResep.vue'),
      meta: { title: 'Telaah Resep', code: 'FRS-02' },
    },
    {
      path: 'komposisi-obat',
      name: 'frs-komposisi-obat',
      component: () => import('./views/KomposisiObat.vue'),
      meta: { title: 'Komposisi Obat', code: 'FRS-03' },
    },
    {
      path: 'serah-terima',
      name: 'frs-serah-terima',
      component: () => import('./views/SerahTerima.vue'),
      meta: { title: 'Serah Terima', code: 'FRS-04' },
    },
    {
      path: 'stok-dan-kartu-persediaan',
      name: 'frs-stok-dan-kartu-persediaan',
      component: () => import('./views/StokKartuPersediaan.vue'),
      meta: { title: 'Stok & Kartu Persediaan', code: 'FRS-05' },
    },
  ],
}
