<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="card"
    :class="cn('bg-card text-card-foreground flex min-w-0 flex-col gap-6 rounded-xl border py-6 shadow-sm', props.class)"
  >
    <!-- 配置驱动渲染器按 slot 分组投递子节点：header / default / footer -->
    <slot name="header" />
    <slot />
    <slot name="footer" />
  </div>
</template>
