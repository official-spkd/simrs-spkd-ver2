import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'farmasi',
  label: 'Farmasi',
  group: 'Penunjang',
  order: 40,
  layout: 'desktop',
  basePath: '/farmasi',
  persona: 'Apt. Ratna',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
