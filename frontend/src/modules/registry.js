/**
 * Registry modul — setiap folder src/modules/<modul>/index.js otomatis terdaftar.
 *
 * Bentuk konfigurasi modul:
 * {
 *   key: 'rawat-jalan',          // unik
 *   label: 'Rawat jalan',        // tampil di sidebar & breadcrumb
 *   group: 'Klinis',             // pengelompokan di pemilih ruang kerja
 *   order: 30,                   // urutan
 *   layout: 'desktop' | 'kiosk' | 'mobile',
 *   basePath: '/rawat-jalan',
 *   persona: 'dr. Andi',         // nama pengguna contoh di header (opsional)
 *   nav: [{ label, to }],        // menu sidebar (desktop)
 *   tabs: [{ label, icon, to }], // navigasi bawah (mobile)
 *   routes: [{ path, name, component, meta: { title, code } }],
 * }
 */
const files = import.meta.glob('./*/index.js', { eager: true })

export const modules = Object.values(files)
  .map((m) => m.default)
  .filter(Boolean)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

export const modulesByKey = Object.fromEntries(modules.map((m) => [m.key, m]))

export const desktopModules = modules.filter((m) => (m.layout ?? 'desktop') === 'desktop' && m.routes?.length)

/** Semua halaman (untuk omnibox pencarian menu). */
export const allPages = modules.flatMap((m) =>
  (m.routes ?? [])
    .filter((r) => !r.path.includes(':'))
    .map((r) => ({
      title: r.meta?.title ?? r.name,
      code: r.meta?.code ?? '',
      module: m.label,
      to: `${m.basePath}${r.path ? `/${r.path}` : ''}`,
    })),
)

export function moduleHome(m) {
  const first = m.routes?.[0]
  return first ? `${m.basePath}${first.path ? `/${first.path}` : ''}` : m.basePath
}
