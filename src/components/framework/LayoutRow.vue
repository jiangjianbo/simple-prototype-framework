<script setup lang="ts">
/** row：栅格布局容器（columns 均分 或 template 自定义，如 '1.8fr 1fr'） */

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    columns?: number
    template?: string
    gap?: number
  }>(),
  { columns: 1, gap: 16 },
)

const style = computed(() => ({
  gridTemplateColumns: props.template ?? `repeat(${props.columns}, minmax(0, 1fr))`,
  gap: `${props.gap}px`,
}))
</script>

<template>
  <div class="grid" :style="style">
    <slot />
  </div>
</template>
