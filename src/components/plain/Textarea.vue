<script setup lang="ts">
/** plain 套件 textarea：契约同 shadcn 版 */

const props = defineProps<{
  class?: string
  modelValue?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    data-slot="textarea"
    :class="props.class"
    class="border-input bg-background placeholder:text-muted-foreground min-h-16 w-full border px-2 py-1.5 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
    :rows="props.rows ?? 3"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    @input="onInput"
  />
</template>
