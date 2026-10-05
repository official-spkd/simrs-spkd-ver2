import partA from './part-a.js'
import partB from './part-b.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'master-data',
  label: 'Master data',
  group: 'Sistem & master',
  order: 90,
  layout: 'desktop',
  basePath: '/master-data',
  persona: 'Admin Rina',
  nav: [...partA.nav, ...partB.nav],
  routes: [...partA.routes, ...partB.routes],
}
