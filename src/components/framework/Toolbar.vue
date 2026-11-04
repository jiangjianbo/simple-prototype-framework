<script setup lang="ts">
/**
 * toolbar（契约组件，套件无关）：工具栏容器。
 * 子节点为按钮/图标钮等任意组件；组间分隔用 separator 或自带分隔样式。
 */
withDefaults(defineProps<{ dense?: boolean }>(), { dense: false })
</script>

<template>
  <div
    data-slot="toolbar"
    :class="dense ? 'gap-0.5' : 'gap-1'"
    class="border-border bg-card flex w-fit items-center rounded-lg border p-1"
  >
    <slot />
  </div>
</template>
