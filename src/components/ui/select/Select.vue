<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from 'reka-ui'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    modelValue?: string
    options?: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  { options: () => [] },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
</script>

<template>
  <SelectRoot
    v-model:open="open"
    :model-value="props.modelValue != null ? String(props.modelValue) : undefined"
    :disabled="props.disabled"
    @update:model-value="(v: unknown) => emit('update:modelValue', String(v ?? ''))"
  >
    <SelectTrigger
      data-slot="select-trigger"
      :class="cn(
        'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*=text-])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 cursor-pointer',
        props.class,
      )"
    >
      <SelectValue :placeholder="props.placeholder ?? '请选择'" />
      <ChevronDownIcon class="size-4 opacity-50" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        data-slot="select-content"
        position="popper"
        :side-offset="4"
        class="pp-animate-in bg-popover text-popover-foreground data-[state=open]:pp-animate-in relative z-50 max-h-(--reka-select-content-available-height) min-w-32 overflow-y-auto overflow-x-hidden rounded-md border shadow-md"
      >
        <SelectScrollUpButton class="flex cursor-default items-center justify-center py-1">
          <ChevronUpIcon class="size-4" />
        </SelectScrollUpButton>
        <SelectViewport class="p-1">
          <SelectItem
            v-for="opt in props.options"
            :key="String(opt.value)"
            :value="String(opt.value)"
            :disabled="opt.disabled"
            class="focus:bg-accent focus:text-accent-foreground [&_svg:not([class*=text-])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <SelectItemText>{{ opt.label }}</SelectItemText>
            <span class="absolute right-2 flex size-3.5 items-center justify-center">
              <SelectItemIndicator>
                <CheckIcon class="size-4" />
              </SelectItemIndicator>
            </span>
          </SelectItem>
        </SelectViewport>
        <SelectScrollDownButton class="flex cursor-default items-center justify-center py-1">
          <ChevronDownIcon class="size-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
