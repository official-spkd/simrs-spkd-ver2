<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'secondary' }, // primary | secondary | danger | success | ghost
  size: { type: String, default: 'md' }, // sm | md | lg
  icon: { type: [Object, Function], default: null },
  to: { type: [String, Object], default: null },
  block: Boolean,
  type: { type: String, default: 'button' },
  disabled: Boolean,
})

const classes = computed(() => [
  'btn',
  props.variant !== 'secondary' && `btn--${props.variant}`,
  props.size !== 'md' && `btn--${props.size}`,
  props.block && 'btn--block',
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <component :is="icon" v-if="icon" aria-hidden="true" />
    <slot />
  </RouterLink>
  <button v-else :type="type" :class="classes" :disabled="disabled">
    <component :is="icon" v-if="icon" aria-hidden="true" />
    <slot />
  </button>
</template>
