<script setup>
/** Isian nominal rupiah: tampil "Rp300.000", nilai model berupa angka. */
import { computed, ref } from 'vue'
import { formatRupiah } from '@/utils/format'

const model = defineModel({ type: Number, default: 0 })
const el = ref(null)
const text = computed({
  get: () => (model.value ? formatRupiah(model.value) : ''),
  set: (v) => (model.value = Number(String(v).replace(/\D/g, '')) || 0),
})
defineExpose({ focus: () => el.value?.focus() })
</script>

<template>
  <input ref="el" v-model="text" class="input" inputmode="numeric" placeholder="Rp0" />
</template>
