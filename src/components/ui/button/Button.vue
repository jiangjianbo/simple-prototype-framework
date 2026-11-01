<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariants } from '.'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  /** JSON 中可直接写 text，作为按钮文案 */
  text?: string
}

const props = defineProps<Props>()
</script>

<template>
  <button
    data-slot="button"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot>{{ props.text }}</slot>
  </button>
</template>
