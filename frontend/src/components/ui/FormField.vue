<script setup>
defineProps({
  label: { type: String, default: '' },
  required: Boolean,
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
</script>

<template>
  <label class="field">
    <span v-if="label" class="field__label">{{ label }}<template v-if="required"> *</template></span>
    <slot />
    <span v-if="error" class="field__error">{{ error }}</span>
    <span v-else-if="hint" class="field__hint">{{ hint }}</span>
  </label>
</template>
