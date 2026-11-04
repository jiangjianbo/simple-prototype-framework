<script setup lang="ts">
/**
 * deckurate 套件 badge：Deckurate base/badge 视觉 —— 胶囊形（rounded-full）+ 实底语义色。
 */
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
    text?: string | number
    class?: string
  }>(),
  { variant: 'default' },
)

const variantCls = computed(() => {
  const v = props.variant
  if (v === 'default') return 'border-transparent bg-primary text-primary-foreground'
  if (v === 'secondary') return 'border-transparent bg-secondary text-secondary-foreground'
  if (v === 'destructive') return 'border-transparent bg-destructive text-white'
  if (v === 'success')
    return 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
  if (v === 'warning')
    return 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  return 'border-border text-foreground' // outline
})
</script>

<template>
  <span
    :class="cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variantCls, props.class)"
  ><slot>{{ text }}</slot></span>
</template>
