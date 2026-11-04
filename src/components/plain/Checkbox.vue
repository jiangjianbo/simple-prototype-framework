<script setup lang="ts">
/** plain 套件 checkbox：原生 input[type=checkbox]（契约同 shadcn 版：modelValue: boolean） */

const props = defineProps<{
  class?: string
  modelValue?: boolean | 'indeterminate'
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<template>
  <input
    type="checkbox"
    data-slot="checkbox"
    :class="props.class"
    class="border-input size-4 cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
    :checked="props.modelValue === true"
    :disabled="props.disabled"
    @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
  />
</template>
