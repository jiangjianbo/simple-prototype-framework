<script setup lang="ts">
import { computed, type Component } from 'vue'
import { resolveIcon } from '@/lib/icon-map'
import { cn } from '@/lib/utils'

/**
 * icon 组件：data 为 `@/` 资源 URL 时渲染图片；否则按 name 渲染 lucide 图标。
 */
const props = withDefaults(
  defineProps<{
    data?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
    boxed?: boolean
    class?: string
  }>(),
  { size: 'sm' },
)

const imgSrc = computed(() => (typeof props.data === 'string' && props.data ? props.data : ''))
const icon = computed(() => resolveIcon(props.name) as Component)

const sizeCls = computed(() => (
  { xs: 'size-3.5', sm: 'size-4', md: 'size-5', lg: 'size-6' } as const
)[props.size])
const boxCls = computed(() => (
  { xs: 'size-6 rounded-md p-1', sm: 'size-8 rounded-lg p-1.5', md: 'size-10 rounded-lg p-2', lg: 'size-12 rounded-xl p-2.5' } as const
)[props.size])
</script>

<template>
  <img
    v-if="imgSrc"
    :src="imgSrc"
    alt="icon"
    :class="cn('object-cover', boxed ? 'rounded-lg' : 'rounded', props.class)"
    :style="{ width: size === 'lg' ? '32px' : '24px', height: size === 'lg' ? '32px' : '24px' }"
  />
  <span v-else-if="props.boxed" :class="cn('bg-primary/10 text-primary inline-flex items-center justify-center', boxCls, props.class)">
    <component :is="icon" :class="sizeCls" />
  </span>
  <component :is="icon" v-else :class="cn(sizeCls, props.class)" />
</template>
