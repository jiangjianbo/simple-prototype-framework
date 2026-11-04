<script setup lang="ts">
/** plain 套件 date-picker：原生 input[type=date]（契约同 shadcn 版：modelValue: string） */

import { formatDate } from '@/lib/utils'

const props = defineProps<{
  class?: string
  modelValue?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <input
    type="date"
    data-slot="date-picker"
    :class="props.class"
    class="border-input bg-background h-9 w-full min-w-0 border px-2 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
    :value="props.modelValue ? formatDate(props.modelValue) : ''"
    :disabled="props.disabled"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
