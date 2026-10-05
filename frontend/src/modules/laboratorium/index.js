import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'laboratorium',
  label: 'Laboratorium',
  group: 'Penunjang',
  order: 45,
  layout: 'desktop',
  basePath: '/laboratorium',
  persona: 'Analis Nita',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
