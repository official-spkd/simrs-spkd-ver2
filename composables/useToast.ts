const toasts = ref<{ id: number; msg: string; kind: string }[]>([])
let n = 0
export function useToast() {
  const show = (msg: string, kind = 'ok') => {
    const id = ++n
    toasts.value.push({ id, msg, kind })
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 3800)
  }
  return {
    toasts,
    ok: (m: string) => show(m, 'ok'),
    err: (m: string) => show(m, 'err'),
    warn: (m: string) => show(m, 'warn'),
    info: (m: string) => show(m, ''),
    /** Jalankan fn; bila melempar Error tampilkan toast merah. Mengembalikan hasil fn atau undefined. */
    attempt: (fn: () => any, okMsg = ''): any => {
      try {
        const r = fn()
        if (okMsg) show(okMsg, 'ok')
        return r === undefined ? true : r
      } catch (e: any) {
        show(e.message || String(e), 'err')
      }
    },
  }
}
