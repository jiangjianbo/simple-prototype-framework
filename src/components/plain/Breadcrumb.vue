<script setup lang="ts">
/**
 * plain 套件 breadcrumb：只消费 breadcrumbState.trail（契约同 shadcn 版 breadcrumb-auto），
 * 点击非末项时 navigate 回跳（触发截断语义）。分隔符用「/」。
 */

import { breadcrumbState } from '@/framework/breadcrumb-store'
import { navigate, getTreeIndex } from '@/framework/navigation'
import { appState } from '@/framework/app-store'

function goto(pageId: string) {
  navigate(pageId, getTreeIndex()?.byId.get(appState.currentPageId))
}
</script>

<template>
  <nav
    v-if="breadcrumbState.trail.length"
    data-slot="breadcrumb"
    class="flex items-center gap-1.5 text-sm"
  >
    <template v-for="(crumb, i) in breadcrumbState.trail" :key="crumb.pageId">
      <button
        v-if="i < breadcrumbState.trail.length - 1"
        type="button"
        class="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
        @click="goto(crumb.pageId)"
      >
        {{ crumb.title }}
      </button>
      <span v-else class="text-foreground font-medium" aria-current="page">{{ crumb.title }}</span>
      <span v-if="i < breadcrumbState.trail.length - 1" class="text-muted-foreground/50">/</span>
    </template>
  </nav>
</template>
