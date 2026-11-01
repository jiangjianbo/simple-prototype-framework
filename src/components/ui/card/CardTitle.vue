<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; text?: string }>()
</script>

<template>
  <div data-slot="card-title" :class="cn('leading-none font-semibold', props.class)">
    <slot>{{ props.text }}</slot>
  </div>
</template>
