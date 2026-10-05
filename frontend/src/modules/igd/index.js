import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'igd',
  label: 'IGD',
  group: 'Operasional & klinis',
  order: 25,
  layout: 'desktop',
  basePath: '/igd',
  persona: 'dr. Sinta',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
