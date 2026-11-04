<script setup lang="ts">
/**
 * service-status（契约组件，套件无关）：服务状态指示器。Deckurate base/service-status-indicator 同款。
 * 彩色描边图标（勾/叹号/叉）+ 状态文案；down 时图标呼吸闪烁。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ status?: 'ok' | 'degraded' | 'down'; label?: string; size?: 'sm' | 'md' | 'lg' }>(),
  { status: 'ok', size: 'md' },
)

const boxCls = computed(
  () => ({ sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' })[props.size],
)
const colorCls = computed(
  () => ({ ok: 'text-emerald-500', degraded: 'text-amber-500', down: 'text-red-500' })[props.status],
)
const defaultLabel = computed(
  () => ({ ok: '正常', degraded: '降级', down: '离线' })[props.status],
)
</script>

<template>
  <span data-slot="service-status" class="inline-flex items-center gap-2">
    <span
      :class="[boxCls, colorCls, status === 'down' ? 'animate-pulse' : '']"
      class="inline-flex items-center justify-center"
    >
      <svg v-if="status === 'ok'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <svg v-else-if="status === 'degraded'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
      </svg>
    </span>
    <span :class="colorCls" class="text-sm font-medium">{{ label ?? defaultLabel }}</span>
  </span>
</template>
