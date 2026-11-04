<script setup lang="ts">
/** plain 套件 alert：左粗边提示框（契约同 shadcn 版 AlertView：variant/title/description/icon） */

import { computed, type Component } from 'vue'
import { resolveIcon } from '@/lib/icon-map'
import { TriangleAlert, CircleAlert, CircleCheck, CircleX } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    class?: string
    variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
    title?: string
    description?: string
    icon?: string
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

const fallbackIcon = computed(() => (
  { info: TriangleAlert, success: CircleCheck, warning: TriangleAlert, destructive: CircleAlert, default: CircleX } as const
)[props.variant ?? 'default'])

const iconCmp = computed(() => (props.icon ? (resolveIcon(props.icon) as Component) : fallbackIcon.value))
</script>

<template>
  <div
    data-slot="alert"
    role="alert"
    :class="[accentCls, props.class]"
    class="bg-card text-card-foreground flex w-full items-start gap-2.5 border border-l-4 px-3 py-2.5 text-sm"
  >
    <component :is="iconCmp" class="mt-0.5 size-4 shrink-0" />
    <div class="min-w-0">
      <div v-if="props.title" class="font-medium">{{ props.title }}</div>
      <div v-if="props.description" class="text-muted-foreground mt-0.5 text-sm">{{ props.description }}</div>
      <slot />
    </div>
  </div>
</template>
