<script setup lang="ts">
/**
 * screen-layout（场景布局）：数据大屏 / 监控墙等全屏场景，套件无关实现。
 * 插槽：icon / title / controls / 默认（内容网格）/ footer
 * controls 槽留空回落契约 layout-controls（顶栏右侧）；建议搭配 dark 主题使用。
 */
import { resolveComponent } from '@/registry'

const ControlsCmp = resolveComponent('layout-controls')!
</script>

<template>
  <div class="bg-background text-foreground flex h-screen flex-col overflow-hidden">
    <header class="flex h-14 shrink-0 items-center gap-3 border-b px-6">
      <slot name="icon" />
      <slot name="title" />
      <div class="ml-auto flex items-center">
        <slot name="controls">
          <component :is="ControlsCmp" />
        </slot>
      </div>
    </header>

    <main class="min-w-0 flex-1 overflow-y-auto p-6">
      <slot />
    </main>

    <footer v-if="$slots.footer" class="shrink-0 border-t px-6 py-2 text-[11px] text-muted-foreground">
      <slot name="footer" />
    </footer>
  </div>
</template>
