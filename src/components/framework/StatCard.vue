<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { resolveIcon } from '@/lib/icon-map'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    title?: string
    value?: string | number
    delta?: string
    icon?: string
    hint?: string
    tone?: 'default' | 'up' | 'down'
  }>(),
  { tone: 'default' },
)

const iconCmp = computed(() => resolveIcon(props.icon) as Component)

const deltaCls = computed(() => (
  { up: 'success', down: 'destructive', default: 'secondary' } as const
)[props.tone])
</script>

<template>
  <div class="bg-card text-card-foreground flex flex-col gap-1 rounded-xl border p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground text-sm">{{ title }}</span>
      <span class="bg-primary/10 text-primary inline-flex items-center justify-center size-8 rounded-lg">
        <component :is="iconCmp" class="size-4" />
      </span>
    </div>
    <div class="flex items-baseline gap-2">
      <span class="text-2xl font-semibold tracking-tight tabular-nums">{{ value }}</span>
      <Badge v-if="delta" :variant="deltaCls" class="gap-0.5">
        {{ tone === 'down' ? '↓' : tone === 'up' ? '↑' : '' }}{{ delta }}
      </Badge>
    </div>
    <span v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</span>
  </div>
</template>
