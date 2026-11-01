<script setup lang="ts">
import type { Component } from 'vue'
import { resolveIcon } from '@/lib/icon-map'
import { Inbox } from 'lucide-vue-next'

defineProps<{
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
    <div class="bg-muted inline-flex size-14 items-center justify-center rounded-full">
      <component :is="icon ? (resolveIcon(icon) as Component) : Inbox" class="size-7" />
    </div>
    <p class="text-sm">{{ description ?? '暂无数据' }}</p>
    <slot />
  </div>
</template>
