/** Unduh baris tabel sebagai CSV (bisa dibuka di Excel). */
export function downloadCsv(name, columns, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = columns.map((c) => esc(c.label)).join(';')
  const body = rows.map((r) => columns.map((c) => esc(c.format ? c.format(r[c.key], r) : r[c.key])).join(';'))
  const blob = new Blob(['﻿' + [head, ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
