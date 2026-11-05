<script setup lang="ts">
/**
 * select-list（契约组件，套件无关）：单选列表。
 * 一列可点选条目（标签/分类/筛选器…），选中项高亮，条目可带右侧计数。
 * props.items 走 FILE_REF_PROPS（URL 自动内联）。用于「左列表 + 右内容」式页面。
 */
import { cn } from '@/lib/utils'

export interface SelectListItem {
  id: string
  label: string
  count?: number
  hint?: string
}

const props = defineProps<{
  items?: SelectListItem[]
  /** 列表顶部小标题（大写弱化字） */
  title?: string
  modelValue?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function pick(id: string) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div data-slot="select-list" class="flex flex-col gap-1">
    <div
      v-if="props.title"
      class="px-2.5 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase"
    >
      {{ props.title }}
    </div>
    <button
      v-for="it in props.items ?? []"
      :key="it.id"
      :class="cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
        props.modelValue === it.id
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )"
      @click="pick(it.id)"
    >
      <span class="truncate">{{ it.label }}</span>
      <span
        v-if="it.count != null"
        class="ml-auto text-xs tabular-nums"
        :class="props.modelValue === it.id ? 'text-primary/80' : 'text-muted-foreground/70'"
      >{{ it.count }}</span>
    </button>
  </div>
</template>
