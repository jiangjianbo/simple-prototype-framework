<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <a data-slot="breadcrumb-link" :class="cn('hover:text-foreground transition-colors cursor-pointer', props.class)">
    <slot />
  </a>
</template>
