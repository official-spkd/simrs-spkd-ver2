import partA from './part-a.js'
import partB from './part-b.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'rawat-inap',
  label: 'Rawat inap',
  group: 'Operasional & klinis',
  order: 30,
  layout: 'desktop',
  basePath: '/rawat-inap',
  persona: 'Ns. Maya',
  nav: [...partA.nav, ...partB.nav],
  routes: [...partA.routes, ...partB.routes],
}
