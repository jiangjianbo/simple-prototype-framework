<script setup lang="ts">
/** plain 套件 input：契约同 shadcn 版（modelValue / disabled / placeholder） */

const props = defineProps<{
  class?: string
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    data-slot="input"
    :class="props.class"
    class="border-input bg-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 border px-2 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    @input="onInput"
  />
</template>
