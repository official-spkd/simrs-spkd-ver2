<script setup>
import { X } from 'lucide-vue-next'
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  width: { type: String, default: '800px' },
})
const open = defineModel('open', { type: Boolean, default: false })

function onKey(e) {
  if (e.key === 'Escape') open.value = false
}
watch(open, (v) => (v ? window.addEventListener('keydown', onKey) : window.removeEventListener('keydown', onKey)))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="open = false">
      <div class="modal" role="dialog" aria-modal="true" :style="{ maxWidth: props.width }">
        <header class="modal__head">
          <div class="modal__titles">
            <h2 class="t-lg">{{ title }}</h2>
            <p v-if="subtitle" class="t-sm t-muted">{{ subtitle }}</p>
          </div>
          <button class="modal__close" aria-label="Tutup" @click="open = false"><X /></button>
        </header>
        <div class="modal__body"><slot /></div>
        <footer v-if="$slots.footer" class="modal__foot"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 45, 80, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 120px 16px 16px;
  z-index: 100;
  overflow-y: auto;
}
.modal {
  width: 100%;
  background: var(--c-surface);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-pop);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.modal__head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.modal__titles { display: flex; flex-direction: column; gap: 4px; }
.modal__close { background: none; border: 0; color: var(--c-muted); padding: 4px; border-radius: var(--r-sm); }
.modal__close:hover { background: var(--c-bg); }
.modal__close svg { width: 20px; height: 20px; }
.modal__body { display: flex; flex-direction: column; gap: 16px; }
.modal__foot { display: flex; justify-content: flex-end; gap: 8px; }
</style>
