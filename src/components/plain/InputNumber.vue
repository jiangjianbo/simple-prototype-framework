<script setup lang="ts">
/** plain 套件 input-number：契约同框架默认版（modelValue: number|null / min / max / step / disabled） */

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: string
    modelValue?: number | null
    min?: number
    max?: number
    step?: number
    placeholder?: string
    disabled?: boolean
  }>(),
  { step: 1 },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()

const display = computed(() => (props.modelValue == null ? '' : String(props.modelValue)))

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') {
    emit('update:modelValue', null)
    return
  }
  const n = Number(raw)
  if (!Number.isNaN(n)) emit('update:modelValue', n)
}
</script>

<template>
  <input
    type="number"
    data-slot="input-number"
    :class="props.class"
    class="border-input bg-background flex h-9 w-full min-w-0 border px-2 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
    :value="display"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    @input="onInput"
  />
</template>
