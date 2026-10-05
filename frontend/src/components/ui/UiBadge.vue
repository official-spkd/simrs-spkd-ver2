<script setup>
defineProps({
  tone: { type: String, default: 'neutral' }, // neutral | primary | success | warning | danger
  dot: Boolean,
})
</script>

<template>
  <span class="badge" :class="tone !== 'neutral' && `badge--${tone}`">
    <template v-if="dot">●</template>
    <slot />
  </span>
</template>
