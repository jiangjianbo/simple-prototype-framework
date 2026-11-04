<script setup lang="ts">
/**
 * deckurate 套件 button：Deckurate base/button 视觉。
 * 特点：default（不传 variant）为灰底描边（bg-secondary + border），primary 才是实心主色。
 */
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    text?: string
    class?: string
  }>(),
  { variant: 'default', size: 'default' },
)

const variantCls = computed(() => {
  const v = props.variant
  if (v === 'primary')
    return 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
  if (v === 'destructive')
    return 'bg-destructive text-white shadow-sm hover:bg-destructive/90'
  if (v === 'outline')
    return 'border-border bg-transparent shadow-sm hover:bg-muted'
  if (v === 'secondary' || v === 'default')
    return 'border-border bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80'
  if (v === 'ghost') return 'hover:bg-muted'
  return 'text-primary underline-offset-4 hover:underline' // link
})

const sizeCls = computed(() => {
  const s = props.size
  if (s === 'sm') return 'h-8 rounded-md px-3 text-xs'
  if (s === 'lg') return 'h-10 rounded-lg px-6 text-base'
  if (s === 'icon') return 'size-9 rounded-lg'
  return 'h-9 rounded-lg px-4 text-sm'
})
</script>

<template>
  <button
    type="button"
    :class="cn('inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50', variantCls, sizeCls, props.class)"
  >
    <slot>{{ text }}</slot>
  </button>
</template>
