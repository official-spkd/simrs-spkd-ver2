<script setup>
/** Tab workspace pasien (gaya segmen); tiap tab membuka layar terkait. */
import { useRouter } from 'vue-router'
import SegTabs from './SegTabs.vue'
import { workspaceTabs } from '../../data-a'

const props = defineProps({
  active: { type: String, default: 'Penilaian' },
})
const router = useRouter()

function pilih(key) {
  const tab = workspaceTabs.find((t) => t.key === key)
  if (tab && key !== props.active) router.push(tab.to)
}
</script>

<template>
  <SegTabs :model-value="active" :tabs="workspaceTabs" @update:model-value="pilih" />
</template>
