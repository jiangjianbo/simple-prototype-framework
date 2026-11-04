<script setup lang="ts">
/**
 * deckurate 套件 app-layout：Deckurate AppLayout 视觉 —— 顶栏三段式（brand 左 / 面包屑中 / 控件右）
 * + 左侧导航栏（menu 槽，可叠加树等）+ 内容区（max-w-1400 居中 + 可选右侧 sidebar 槽）。
 * 契约插槽与 shadcn 版 app-layout 完全一致：icon / title / menu / breadcrumb / controls / content / sidebar / footer。
 */
import { resolveComponent } from '@/registry'

const ControlsCmp = resolveComponent('layout-controls')!
</script>

<template>
  <div class="bg-background text-foreground flex h-screen flex-col overflow-hidden">
    <!-- 顶栏：brand（icon+title）左，breadcrumb 中，controls 右 -->
    <header class="border-border bg-card flex h-14 shrink-0 items-center gap-4 border-b px-4">
      <div class="flex shrink-0 items-center gap-2.5">
        <slot name="icon" />
        <slot name="title" />
      </div>
      <div class="min-w-0 flex-1">
        <slot name="breadcrumb" />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="controls">
          <component :is="ControlsCmp" />
        </slot>
      </div>
    </header>

    <div class="flex min-w-0 flex-1 overflow-hidden">
      <!-- 左侧导航栏：menu + footer -->
      <aside class="border-border hidden w-64 shrink-0 flex-col border-r md:flex">
        <div class="flex-1 overflow-y-auto px-3 py-3">
          <slot name="menu" />
        </div>
        <div v-if="$slots.footer" class="border-border shrink-0 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          <slot name="footer" />
        </div>
      </aside>

      <!-- 内容区：content + 可选右侧 sidebar -->
      <main class="min-w-0 flex-1 overflow-y-auto">
        <div class="mx-auto flex w-full max-w-[1400px] gap-6 p-6">
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
