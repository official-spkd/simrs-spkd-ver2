import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'sdm',
  label: 'SDM & presensi',
  group: 'Manajemen & sumber daya',
  order: 70,
  layout: 'desktop',
  basePath: '/sdm',
  persona: 'HRD Lina',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
