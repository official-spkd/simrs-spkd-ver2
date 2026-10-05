import partA from './part-a.js'
import partB from './part-b.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'kiosk',
  label: 'Anjungan mandiri',
  group: 'Aplikasi',
  order: 200,
  layout: 'kiosk',
  basePath: '/kiosk',
  nav: [...partA.nav, ...partB.nav],
  routes: [...partA.routes, ...partB.routes],
}
