<script setup>
/**
 * Tabel "Daftar data" sesuai desain Figma: judul, pencarian, Filter/Excel/PDF,
 * kepala kolom dapat diurutkan, baris zebra + baris terpilih, dan paginasi.
 *
 * columns: [{ key, label, width?, strong?, align?, sortable? (default true),
 *             tone?: (row) => 'success'|'warning'|'danger'|'primary'|'muted',
 *             format?: (value, row) => string }]
 * Slot per sel: #cell-<key>="{ row, value }"
 */
import { computed, ref, watch } from 'vue'
import { Search, ListFilter } from 'lucide-vue-next'
import { downloadCsv } from '@/utils/export'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  searchable: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: 'Cari data…' },
  exportable: { type: Boolean, default: true },
  filterable: { type: Boolean, default: true },
  pageSize: { type: Number, default: 10 },
  paginated: { type: Boolean, default: true },
  selectable: { type: Boolean, default: false },
  exportName: { type: String, default: 'data' },
  emptyText: { type: String, default: 'Tidak ada data yang cocok.' },
})
const emit = defineEmits(['row-click', 'filter'])
const selected = defineModel('selected', { default: null })

const query = ref('')
const sortKey = ref(null)
const sortDir = ref(1)
const page = ref(1)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter((r) =>
    props.columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q)),
  )
})

const sorted = computed(() => {
  if (!sortKey.value) return filtered.value
  const k = sortKey.value
  return [...filtered.value].sort((a, b) => {
    const x = a[k]
    const y = b[k]
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * sortDir.value
    return String(x ?? '').localeCompare(String(y ?? ''), 'id', { numeric: true }) * sortDir.value
  })
})

const totalPages = computed(() => (props.paginated ? Math.max(1, Math.ceil(sorted.value.length / props.pageSize)) : 1))
const visible = computed(() =>
  props.paginated ? sorted.value.slice((page.value - 1) * props.pageSize, page.value * props.pageSize) : sorted.value,
)
const rangeText = computed(() => {
  const n = sorted.value.length
  if (!n) return `0 data · ${props.pageSize} / halaman`
  const start = props.paginated ? (page.value - 1) * props.pageSize + 1 : 1
  const end = props.paginated ? Math.min(n, page.value * props.pageSize) : n
  return `${start}–${end} dari ${n} data · ${props.pageSize} / halaman`
})

watch([query, () => props.rows], () => (page.value = 1))

function toggleSort(col) {
  if (col.sortable === false) return
  if (sortKey.value === col.key) sortDir.value = -sortDir.value
  else {
    sortKey.value = col.key
    sortDir.value = 1
  }
}

function onRow(row) {
  if (props.selectable) selected.value = row[props.rowKey]
  emit('row-click', row)
}

function cellValue(col, row) {
  const v = row[col.key]
  return col.format ? col.format(v, row) : v
}

function exportExcel() {
  downloadCsv(props.exportName, props.columns, sorted.value)
}
function exportPdf() {
  window.print()
}
</script>

<template>
  <section class="dt card card--flush">
    <header v-if="title || $slots.actions" class="dt__title">
      <div class="dt__titles">
        <h3 class="t-title">{{ title }}</h3>
        <p v-if="subtitle" class="t-sm t-muted">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="dt__title-actions"><slot name="actions" /></div>
    </header>

    <div v-if="searchable || exportable || filterable || $slots.toolbar" class="dt__toolbar no-print">
      <label v-if="searchable" class="dt__search">
        <Search aria-hidden="true" />
        <input v-model="query" type="search" :placeholder="searchPlaceholder" :aria-label="searchPlaceholder" />
      </label>
      <div class="dt__tools">
        <slot name="toolbar" />
        <button v-if="filterable" class="btn" type="button" @click="emit('filter')"><ListFilter aria-hidden="true" />Filter</button>
        <template v-if="exportable">
          <button class="btn" type="button" @click="exportExcel">Excel</button>
          <button class="btn" type="button" @click="exportPdf">PDF</button>
        </template>
      </div>
    </div>

    <div class="dt__scroll">
      <div class="dt__table" role="table">
        <div class="dt__head" role="row">
          <button
            v-for="col in columns"
            :key="col.key"
            class="dt__th"
            role="columnheader"
            type="button"
            :style="col.width ? { flex: `0 0 ${col.width}` } : null"
            :class="{ 't-right': col.align === 'right', 'is-sorted': sortKey === col.key }"
            :disabled="col.sortable === false"
            @click="toggleSort(col)"
          >
            {{ col.label }}<template v-if="col.sortable !== false"> {{ sortKey === col.key ? (sortDir > 0 ? '↑' : '↓') : '↕' }}</template>
          </button>
        </div>

        <div
          v-for="(row, i) in visible"
          :key="row[rowKey] ?? i"
          class="dt__row"
          role="row"
          :class="{
            'is-alt': i % 2 === 1,
            'is-selected': selectable && selected === row[rowKey],
            'is-clickable': selectable || $attrs.onRowClick,
          }"
          @click="onRow(row)"
        >
          <div
            v-for="col in columns"
            :key="col.key"
            class="dt__td"
            role="cell"
            :style="col.width ? { flex: `0 0 ${col.width}` } : null"
            :class="[
              col.strong && 't-strong',
              col.align === 'right' && 't-right',
              col.tone && col.tone(row) && `t-${col.tone(row)}`,
            ]"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ cellValue(col, row) }}</slot>
          </div>
        </div>

        <p v-if="!visible.length" class="dt__empty">{{ emptyText }}</p>
      </div>
    </div>

    <footer v-if="paginated" class="dt__pager no-print">
      <p class="t-xs t-muted">{{ rangeText }}</p>
      <nav class="dt__pages" aria-label="Paginasi">
        <button type="button" class="dt__pagelink" :disabled="page === 1" @click="page--">‹ Sebelumnya</button>
        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          class="dt__pagelink"
          :class="{ 'is-current': p === page }"
          @click="page = p"
        >
          {{ p }}
        </button>
        <button type="button" class="dt__pagelink" :disabled="page === totalPages" @click="page++">Berikutnya ›</button>
      </nav>
    </footer>
  </section>
</template>

<style scoped>
.dt { width: 100%; }
.dt__title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 18px; }
.dt__titles { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dt__title-actions { display: flex; gap: 8px; }
.dt__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; flex-wrap: wrap; }
.dt__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 260px;
  max-width: 100%;
  padding: 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-muted);
}
.dt__search svg { width: 16px; height: 16px; flex-shrink: 0; }
.dt__search input { border: 0; outline: 0; background: none; font-size: 12px; width: 100%; padding: 0; }
.dt__search:focus-within { border-color: var(--c-primary); }
.dt__tools { display: flex; gap: 8px; flex-wrap: wrap; }
.dt__scroll { overflow-x: auto; }
.dt__table { min-width: 640px; }
.dt__head { display: flex; gap: 12px; padding: 12px 16px; background: var(--c-bg); }
.dt__th {
  flex: 1 1 0;
  min-width: 0;
  background: none;
  border: 0;
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
  text-align: left;
}
.dt__th:disabled { cursor: default; }
.dt__th.is-sorted { color: var(--c-text); }
.dt__row {
  display: flex;
  gap: 12px;
  padding: 15px 16px;
  font-size: 12px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
}
.dt__row.is-alt { background: var(--c-row-alt); }
.dt__row.is-selected { background: var(--c-primary-soft); }
.dt__row.is-clickable { cursor: pointer; }
.dt__row.is-clickable:hover:not(.is-selected) { background: #f5f8fc; }
.dt__td { flex: 1 1 0; min-width: 0; overflow-wrap: anywhere; }
.dt__empty { padding: 32px 16px; text-align: center; font-size: 12px; color: var(--c-muted); }
.dt__pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; flex-wrap: wrap; }
.dt__pages { display: flex; align-items: center; gap: 8px; }
.dt__pagelink { background: none; border: 0; padding: 0 2px; font-size: 14px; color: var(--c-muted); }
.dt__pagelink:disabled { opacity: 0.5; cursor: default; }
.dt__pagelink.is-current {
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: var(--r-pill);
}
</style>
