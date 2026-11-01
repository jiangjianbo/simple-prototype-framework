<script setup lang="ts">
/**
 * menu-tree（§7.2）：消费 appState.menu（/systems/xx/xx.menu.json），
 * 点击时调用 navigate(pageId)——菜单点击与 @goto 共用同一导航入口（§9.4）。
 */

import { computed } from 'vue'
import { appState } from '@/framework/app-store'
import MenuGroup from './MenuGroup.vue'

const props = defineProps<{ title?: string }>()

const items = computed(() => appState.menu?.items ?? [])
const heading = computed(() => props.title ?? appState.menu?.title ?? '')
</script>

<template>
  <nav class="space-y-3">
    <div
      v-if="heading"
      class="px-2.5 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase"
    >
      {{ heading }}
    </div>
    <MenuGroup :items="items" />
  </nav>
</template>
