<script setup lang="ts">
/** plain 套件 alert 原语盒（契约 alert / alert-title / alert-description 中的盒子，供 page-view 装配状态机告警） */

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: string
    variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  }>(),
  { variant: 'default' },
)

const accentCls = computed(
  () =>
    ({
      default: 'border-l-foreground',
      info: 'border-l-primary',
      success: 'border-l-emerald-500',
      warning: 'border-l-amber-500',
      destructive: 'border-l-destructive',
    })[props.variant ?? 'default'],
)
</script>

<template>
  <div
    data-slot="alert"
    role="alert"
    :class="[accentCls, props.class]"
    class="bg-card text-card-foreground w-full border border-l-4 px-3 py-2.5 text-sm"
  >
    <slot />
  </div>
</template>
