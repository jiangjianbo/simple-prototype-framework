<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AvatarFallback } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  text?: string
  delayMs?: number
}>()
</script>

<template>
  <AvatarFallback
    data-slot="avatar-fallback"
    :delay-ms="props.delayMs"
    :class="cn('bg-muted flex size-full items-center justify-center rounded-full text-xs', props.class)"
  >
    <slot>{{ props.text }}</slot>
  </AvatarFallback>
</template>
