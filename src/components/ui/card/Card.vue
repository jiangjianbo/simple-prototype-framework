<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import CardContent from './CardContent.vue'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="card"
    :class="cn('bg-card text-card-foreground flex min-w-0 flex-col gap-6 rounded-xl border py-6 shadow-sm', props.class)"
  >
    <!-- 配置驱动渲染器按 slot 分组投递子节点：header / default / footer；
         根元素只有 py-6，default 槽包 CardContent 补水平内边距（与 header 对齐） -->
    <slot name="header" />
    <CardContent v-if="$slots.default"><slot /></CardContent>
    <slot name="footer" />
  </div>
</template>
