<script setup lang="ts">
/**
 * plain 套件 nav-menu：消费 appState.menu（角色过滤语义与 shadcn 版一致），
 * 递归渲染分组/菜单项，点击 navigate(pageId)。视觉：直角、左侧指示条标记激活项。
 */

import { computed, type Component } from 'vue'
import type { MenuItem } from '@/framework/types'
import { appState } from '@/framework/app-store'
import { filterMenuByRole } from '@/framework/role'
import { navigate, getTreeIndex } from '@/framework/navigation'
import { resolveIcon } from '@/lib/icon-map'

const props = withDefaults(
  defineProps<{
    title?: string
    items?: MenuItem[]
    depth?: number
  }>(),
  { depth: 0 },
)

const rootItems = computed(() =>
  props.items ? props.items : filterMenuByRole(appState.menu?.items ?? [], appState.role),
)
const heading = computed(() => (props.items ? '' : props.title ?? appState.menu?.title ?? ''))

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
</script>

<template>
  <nav class="space-y-3">
    <div
      v-if="heading"
      class="px-2.5 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase"
    >
      {{ heading }}
    </div>
    <div class="space-y-0.5">
      <template v-for="item in rootItems" :key="item.label + (item.pageId ?? '')">
        <!-- 分组标题（无 pageId 且有子项） -->
        <div v-if="!item.pageId && item.children?.length" class="space-y-0.5 pb-1">
          <div
            class="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase"
          >
            <component :is="iconOf(item)" v-if="item.icon" class="size-3.5" />
            {{ item.label }}
          </div>
          <NavMenu :items="item.children" :depth="props.depth" />
        </div>

        <!-- 可点击菜单项（可带子级列表） -->
        <div v-else class="space-y-0.5">
          <button
            type="button"
            class="group flex w-full cursor-pointer items-center gap-2.5 py-1.5 pr-2.5 text-left text-sm transition-colors"
            :class="isActive(item)
              ? 'text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'"
            :style="{ paddingLeft: `${10 + (item.pageId ? props.depth * 14 : 0)}px` }"
            @click="open(item)"
          >
            <span
              class="h-4 w-0.5 shrink-0"
              :class="isActive(item) ? 'bg-primary' : 'bg-transparent'"
            />
            <component :is="iconOf(item)" v-if="item.icon" class="size-4 shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </button>
          <NavMenu v-if="item.children?.length" :items="item.children" :depth="props.depth + 1" />
        </div>
      </template>
    </div>
  </nav>
</template>
