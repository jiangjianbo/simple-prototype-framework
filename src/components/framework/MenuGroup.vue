<script setup lang="ts">
import { type Component } from 'vue'
import type { MenuItem } from '@/framework/types'
import { appState } from '@/framework/app-store'
import { navigate, getTreeIndex } from '@/framework/navigation'
import { resolveIcon } from '@/lib/icon-map'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    items: MenuItem[]
    depth?: number
  }>(),
  { depth: 0 },
)

function open(item: MenuItem) {
  if (!item.pageId) return
  navigate(item.pageId, getTreeIndex()?.byId.get(appState.currentPageId))
}

function isActive(item: MenuItem): boolean {
  if (item.pageId === appState.currentPageId) return true
  return (item.children ?? []).some(isActive)
}

function iconOf(item: MenuItem): Component {
  return resolveIcon(item.icon)
}

function itemClass(item: MenuItem): string {
  const active = isActive(item)
  return cn(
    'group flex w-full items-center gap-2.5 rounded-lg py-2 pr-2.5 text-sm transition-colors cursor-pointer text-left',
    active
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  )
}

function indentStyle(item: MenuItem) {
  const extra = item.pageId ? props.depth * 12 : 0
  return { paddingLeft: `${10 + extra}px` }
}
</script>

<template>
  <div class="space-y-1">
    <template v-for="item in props.items" :key="item.label + (item.pageId ?? '')">
      <!-- 分组标题（无 pageId 且有子项） -->
      <div v-if="!item.pageId && item.children?.length" class="space-y-1 pb-1">
        <div class="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          <component :is="iconOf(item)" v-if="item.icon" class="size-3.5" />
          {{ item.label }}
        </div>
        <MenuGroup :items="item.children" :depth="props.depth" />
      </div>

      <!-- 可点击菜单项（可带子级列表） -->
      <div v-else class="space-y-0.5">
        <button :class="itemClass(item)" :style="indentStyle(item)" @click="open(item)">
          <component :is="iconOf(item)" v-if="item.icon" class="size-4 shrink-0" />
          <span class="truncate">{{ item.label }}</span>
          <span v-if="item.pageId !== appState.currentPageId && isActive(item)" class="ml-auto size-1.5 rounded-full bg-primary/60" />
        </button>
        <MenuGroup v-if="item.children?.length" :items="item.children" :depth="props.depth + 1" />
      </div>
    </template>
  </div>
</template>
