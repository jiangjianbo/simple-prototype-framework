<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Label } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  for?: string
  text?: string
}>()
</script>

<template>
  <Label
    data-slot="label"
    :for="props.for"
    :class="cn(
      'flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      props.class,
    )"
  >
    <slot>{{ props.text }}</slot>
  </Label>
</template>
