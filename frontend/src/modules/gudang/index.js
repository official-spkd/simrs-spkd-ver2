import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'gudang',
  label: 'Gudang & logistik',
  group: 'Manajemen & sumber daya',
  order: 65,
  layout: 'desktop',
  basePath: '/gudang',
  persona: 'Gudang Yusuf',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
