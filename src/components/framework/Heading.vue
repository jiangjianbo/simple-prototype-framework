<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    text?: string
    data?: any
    level?: 1 | 2 | 3 | 4
    class?: string
  }>(),
  { level: 3 },
)

const content = computed(() => (typeof props.data === 'string' ? props.data : props.text ?? ''))
const cls = computed(() => (
  {
    1: 'text-2xl font-bold tracking-tight',
    2: 'text-xl font-semibold tracking-tight',
    3: 'text-lg font-semibold',
    4: 'text-base font-semibold',
  } as const
)[props.level ?? 3])
</script>

<template>
  <component :is="`h${props.level}`" :class="cn(cls, props.class)">{{ content }}</component>
</template>
