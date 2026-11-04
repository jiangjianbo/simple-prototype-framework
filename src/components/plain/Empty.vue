<script setup lang="ts">
/** plain 套件 empty：直角图标盒空状态（契约同 shadcn 版） */

import { computed, type Component } from 'vue'
import { Inbox } from 'lucide-vue-next'
import { resolveIcon } from '@/lib/icon-map'

const props = defineProps<{
  description?: string
  icon?: string
}>()

const iconCmp = computed(() => (props.icon ? (resolveIcon(props.icon) as Component) : Inbox))
</script>

<template>
  <div class="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
    <div class="border-muted-foreground/30 inline-flex size-14 items-center justify-center border border-dashed">
      <component :is="iconCmp" class="size-7" />
    </div>
    <p class="text-sm">{{ description ?? '暂无数据' }}</p>
    <slot />
  </div>
</template>
