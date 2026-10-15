<script setup lang="ts">
// Pemilih tagihan untuk halaman Pembayaran / Invoice yang dibuka dari sidebar (tanpa id di URL).
const props = defineProps<{ modelValue: string; statuses: string[]; label: string }>()
const emit = defineEmits(['update:modelValue'])
const { db, tagihanList, patient } = useDb()
const options = computed(() =>
  tagihanList()
    .filter((v: any) => props.statuses.includes(db.bills[v.id]?.status))
    .sort((a: any, b: any) => props.statuses.indexOf(db.bills[a.id].status) - props.statuses.indexOf(db.bills[b.id].status))
    .map((v: any) => ({ id: v.id, text: `${db.bills[v.id].noInv} · ${patient(v.patientId).nama} · ${db.bills[v.id].status}` })),
)
</script>

<template>
  <div class="field" style="max-width: 460px; margin-bottom: 16px">
    <label for="k-pick">{{ label }}</label>
    <select id="k-pick" class="select" :value="modelValue" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-if="!options.length" value="">Belum ada tagihan</option>
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.text }}</option>
    </select>
  </div>
</template>
