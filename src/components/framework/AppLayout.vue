<script setup lang="ts">
/**
 * app-layout（场景布局 §「场景布局」）：主应用框架（shadcn 套件实现）。
 * 插槽：icon / title / menu / breadcrumb / controls / content / sidebar / footer
 * controls 槽承载切换控件簇，留空回落契约组件 layout-controls（系统/套件/主题/角色）。
 * menu / breadcrumb 槽留空时由配置层提供（原型配置默认写入 nav-menu / breadcrumb）。
 */

import { resolveComponent } from '@/registry'

const ControlsCmp = resolveComponent('layout-controls')!
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- 左侧：icon + title + menu + footer -->
    <aside class="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div class="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <slot name="icon" />
        <slot name="title" />
      </div>
      <div class="flex-1 overflow-y-auto px-2 py-3">
        <slot name="menu" />
      </div>
      <div class="shrink-0 px-4 py-2.5 text-[11px] text-muted-foreground">
        <slot name="footer" />
        <div class="mt-0.5">Prototype System · JSON-driven</div>
      </div>
    </aside>

    <!-- 右侧：breadcrumb + controls + content + sidebar -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center gap-4 border-b bg-background/70 px-5 backdrop-blur">
        <slot name="breadcrumb" />
        <div class="ml-auto flex items-center">
          <slot name="controls">
            <component :is="ControlsCmp" />
          </slot>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto flex w-full max-w-[1440px] gap-6 p-6">
          <div class="min-w-0 flex-1">
            <slot name="content" />
          </div>
          <aside v-if="$slots.sidebar" class="hidden w-80 shrink-0 xl:block">
            <slot name="sidebar" />
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>
