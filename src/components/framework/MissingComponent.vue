<script setup lang="ts">
defineProps<{
  /** 未知组件/类型兜底展示 */
  message?: string
  text?: string
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-md border border-dashed border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400"
  >
    <slot>{{ message ?? text ?? '?' }}</slot>
  </span>
</template>
