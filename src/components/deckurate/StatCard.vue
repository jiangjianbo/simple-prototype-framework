<script setup lang="ts">
/**
 * deckurate 套件 stat-card：Deckurate base/stat-card 视觉。
 * 语义色染色底（color: default/primary/success/warning/danger）+ hover 阴影 + 数值 tabular-nums。
 * 契约同 shadcn 版（title/value/delta/icon/hint/tone），扩展 color prop。
 */
import { computed } from 'vue'
import type { Component } from 'vue'
import { resolveIcon } from '@/lib/icon-map'
import DeckBadge from './Badge.vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    title?: string
    value?: string | number
    delta?: string
    icon?: string
    hint?: string
    tone?: 'default' | 'up' | 'down'
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    class?: string
  }>(),
  { tone: 'default', color: 'default' },
)

const iconCmp = computed(() => resolveIcon(props.icon) as Component)

const deltaCls = computed(() => (
  { up: 'success', down: 'destructive', default: 'secondary' } as const
)[props.tone])

const colorCls = computed(() => {
  const c = props.color
  if (c === 'primary') return 'border-primary/20 bg-primary/5'
  if (c === 'success') return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
  if (c === 'warning') return 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
  if (c === 'danger') return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
  return 'border-border bg-card'
})
</script>

<template>
  <div
    data-slot="stat-card"
    :class="cn(colorCls, props.class)"
    class="flex flex-col gap-1 rounded-xl border p-4 text-start transition-shadow hover:shadow-md"
  >
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground text-sm">{{ title }}</span>
      <span
        class="inline-flex size-8 items-center justify-center rounded-lg"
        :class="color === 'default' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
      >
        <component :is="iconCmp" class="size-4" />
      </span>
    </div>
    <div class="flex items-baseline gap-2">
      <span class="text-2xl font-semibold tracking-tight tabular-nums">{{ value }}</span>
      <DeckBadge v-if="delta" :variant="deltaCls" class="gap-0.5">
        {{ tone === 'down' ? '↓' : tone === 'up' ? '↑' : '' }}{{ delta }}
      </DeckBadge>
    </div>
    <span v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</span>
  </div>
</template>
