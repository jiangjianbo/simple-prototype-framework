<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { RadioGroupRoot, RadioGroupItem, RadioGroupIndicator } from 'reka-ui'
import { CircleIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export interface RadioOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    modelValue?: string
    options?: RadioOption[]
    disabled?: boolean
    orientation?: 'horizontal' | 'vertical'
  }>(),
  { options: () => [], orientation: 'horizontal' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <RadioGroupRoot
    data-slot="radio-group"
    :model-value="props.modelValue != null ? String(props.modelValue) : undefined"
    :disabled="props.disabled"
    :class="cn('grid gap-3', props.orientation === 'horizontal' ? 'flex flex-wrap items-center' : '', props.class)"
    @update:model-value="(v: unknown) => emit('update:modelValue', String(v ?? ''))"
  >
    <label
      v-for="opt in props.options"
      :key="String(opt.value)"
      class="flex items-center gap-2 text-sm cursor-pointer has-[button:disabled]:opacity-50 has-[button:disabled]:cursor-not-allowed"
    >
      <RadioGroupItem
        :value="String(opt.value)"
        :disabled="props.disabled || opt.disabled"
        class="border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RadioGroupIndicator class="flex items-center justify-center">
          <CircleIcon class="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
        </RadioGroupIndicator>
      </RadioGroupItem>
      <span>{{ opt.label }}</span>
    </label>
  </RadioGroupRoot>
</template>
