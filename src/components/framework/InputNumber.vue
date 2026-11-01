<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    min?: number
    max?: number
    step?: number
    placeholder?: string
    disabled?: boolean
    class?: string
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
    :class="cn(
      'border-input dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    :value="display"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    @input="onInput"
  />
</template>
