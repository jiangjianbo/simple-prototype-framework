<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    text?: string
    data?: any
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
    muted?: boolean
    strong?: boolean
    class?: string
  }>(),
  { size: 'sm' },
)

const content = computed(() => {
  if (typeof props.data === 'string') return props.data
  if (props.data != null && typeof props.data !== 'object') return String(props.data)
  return props.text ?? ''
})

const sizeClass = computed(() => (
  {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  } as const
)[props.size ?? 'sm'])
</script>

<template>
  <span :class="cn(sizeClass, props.muted ? 'text-muted-foreground' : '', props.strong ? 'font-semibold' : '', props.class)">
    {{ content }}
  </span>
</template>
