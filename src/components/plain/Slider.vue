<script setup lang="ts">
/** plain 套件 slider：原生 input[type=range]（契约同 shadcn 版：modelValue: number[]） */

const props = defineProps<{
  class?: string
  modelValue?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: number[]): void }>()
</script>

<template>
  <input
    type="range"
    data-slot="slider"
    :class="props.class"
    class="accent-[var(--primary)] w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    :value="props.modelValue?.[0] ?? props.min ?? 0"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :disabled="props.disabled"
    @input="emit('update:modelValue', [Number(($event.target as HTMLInputElement).value)])"
  />
</template>
