<script setup lang="ts">
/** plain 套件 button：直角边框按钮，variant 语义与 shadcn 版一致 */

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: string
    text?: string
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    disabled?: boolean
  }>(),
  { variant: 'default', size: 'default' },
)

const variantCls = computed(
  () =>
    ({
      default: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
      primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80',
      outline: 'bg-background border-input hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-white border-destructive hover:bg-destructive/90',
      ghost: 'border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground',
      link: 'border-transparent bg-transparent text-primary underline-offset-4 hover:underline',
    })[props.variant ?? 'default'],
)

const sizeCls = computed(
  () =>
    ({
      default: 'h-8 px-3 text-sm',
      sm: 'h-7 px-2 text-xs',
      lg: 'h-9 px-5 text-sm',
      icon: 'size-8',
    })[props.size ?? 'default'],
)
</script>

<template>
  <button
    data-slot="button"
    :class="[variantCls, sizeCls, props.class]"
    class="inline-flex cursor-pointer items-center justify-center gap-1.5 border font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50"
  >
    <slot>{{ props.text }}</slot>
  </button>
</template>
