<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { cn, formatDate } from '@/lib/utils'

/**
 * 原型阶段的轻量 date-picker：styled native input[type=date]。
 * 未来需要面板式日历时可替换为 reka-ui DatePicker（Popover + Calendar）。
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="relative" :class="props.disabled ? 'opacity-50' : ''">
    <input
      type="date"
      data-slot="date-picker"
      :class="cn(
        'border-input dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )"
      :value="props.modelValue ? formatDate(props.modelValue) : ''"
      :disabled="props.disabled"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <CalendarIcon class="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
  </div>
</template>
