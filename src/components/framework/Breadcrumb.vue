<script setup lang="ts">
/**
 * breadcrumb（§9.2）：只消费 breadcrumbState.trail，
 * 点击非末项时 navigate 回跳（触发截断语义）。
 */

import { breadcrumbState } from '@/framework/breadcrumb-store'
import { navigate, getTreeIndex } from '@/framework/navigation'
import { appState } from '@/framework/app-store'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

function goto(pageId: string) {
  navigate(pageId, getTreeIndex()?.byId.get(appState.currentPageId))
}
</script>

<template>
  <Breadcrumb v-if="breadcrumbState.trail.length">
    <BreadcrumbList>
      <template v-for="(crumb, i) in breadcrumbState.trail" :key="crumb.pageId">
        <BreadcrumbItem>
          <BreadcrumbLink v-if="i < breadcrumbState.trail.length - 1" @click="goto(crumb.pageId)">
            {{ crumb.title }}
          </BreadcrumbLink>
          <BreadcrumbPage v-else>{{ crumb.title }}</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="i < breadcrumbState.trail.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
