<script setup lang="ts">
import { Progress } from '@/components/ui/progress'

const props = withDefaults(
  defineProps<{
    value?: number
    max?: number
  }>(),
  { value: 0, max: 100 },
)
</script>

<template>
  <div class="flex w-full items-center gap-3">
    <Progress class="flex-1" :model-value="Math.min(100, (props.value / (props.max || 100)) * 100)" />
    <span class="text-muted-foreground w-10 text-right text-xs tabular-nums">{{ props.value }}{{ props.max === 100 ? '%' : `/${props.max}` }}</span>
  </div>
</template>
