import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'manajemen',
  label: 'Manajemen & pelaporan',
  group: 'Manajemen & sumber daya',
  order: 75,
  layout: 'desktop',
  basePath: '/manajemen',
  persona: 'Direktur',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
