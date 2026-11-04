<script setup lang="ts">
/** plain 套件 badge：直角小徽章，variant 语义与 shadcn 版一致 */

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: string
    text?: string | number
    variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
  }>(),
  { variant: 'default' },
)

const variantCls = computed(
  () =>
    ({
      default: 'bg-primary text-primary-foreground border-transparent',
      secondary: 'bg-secondary text-secondary-foreground border-transparent',
      destructive: 'bg-destructive text-white border-transparent',
      success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      outline: 'bg-transparent text-foreground',
    })[props.variant ?? 'default'],
)
</script>

<template>
  <span
    data-slot="badge"
    :class="[variantCls, props.class]"
    class="inline-flex w-fit items-center justify-center border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap"
  >
    <slot>{{ props.text }}</slot>
  </span>
</template>
