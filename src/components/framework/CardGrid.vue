<script setup lang="ts">
/**
 * card-grid（契约组件，套件无关）：卡片画廊。
 * 把实例数据（rows，URL 自动内联）呈现为封面卡片网格——文档列表画廊模式、
 * 标签卡片墙等。字段映射可配（imageField/titleField/metaFields/badgeField）；
 * rowGoto 让整卡可点击跳转页面。badge 经契约解析（随套件变形）。
 */
import { computed } from 'vue'
import { FileText } from 'lucide-vue-next'
import { resolveComponent } from '@/registry'
import { navigate } from '@/framework/navigation'
import EmptyView from './EmptyView.vue'

const props = withDefaults(
  defineProps<{
    rows?: any[]
    /** 封面图字段（行内 URL）；个别行缺省渲染占位块，全部行缺省则媒体区整体省略 */
    imageField?: string
    titleField?: string
    /** 次要信息字段列表（依次以 · 分隔展示） */
    metaFields?: string[]
    /** 徽标字段（有媒体区时右上角小胶囊，无媒体区时标题行内联） */
    badgeField?: string
    /** 固定列数；缺省自适应（minmax 200px） */
    columns?: number
    /** 点击卡片跳转的页面 id */
    rowGoto?: string
  }>(),
  { imageField: 'cover', titleField: 'title', metaFields: () => [] },
)

const Badge = resolveComponent('badge')!

const items = computed(() => props.rows ?? [])

/** 至少一行带封面才渲染媒体区；纯文本数据（如标签墙）整体省略，避免满屏占位图形 */
const hasMedia = computed(() =>
  items.value.some(row => row?.[props.imageField] != null && row?.[props.imageField] !== ''),
)

const gridStyle = computed(() => ({
  gridTemplateColumns: props.columns
    ? `repeat(${props.columns}, minmax(0, 1fr))`
    : 'repeat(auto-fill, minmax(200px, 1fr))',
}))

function metaOf(row: any): string {
  return (props.metaFields ?? [])
    .map(f => row?.[f])
    .filter(v => v != null && v !== '')
    .join(' · ')
}

function open(row: any) {
  if (props.rowGoto) navigate(props.rowGoto)
}
</script>

<template>
  <EmptyView v-if="!items.length" />
  <div v-else data-slot="card-grid" class="grid gap-4" :style="gridStyle">
    <div
      v-for="(row, i) in items"
      :key="row?.id ?? i"
      data-slot="card-grid-item"
      class="border-border bg-card hover:border-primary/40 group overflow-hidden rounded-lg border transition-colors"
      :class="props.rowGoto ? 'cursor-pointer' : ''"
      @click="open(row)"
    >
      <div v-if="hasMedia" data-slot="card-grid-media" class="bg-muted relative aspect-video w-full overflow-hidden">
        <img
          v-if="row?.[props.imageField]"
          :src="row[props.imageField]"
          :alt="row?.[props.titleField] ?? ''"
          class="size-full object-cover"
        />
        <span v-else class="text-muted-foreground/50 flex size-full items-center justify-center">
          <FileText class="size-8" />
        </span>
        <Badge
          v-if="props.badgeField && row?.[props.badgeField] != null"
          class="absolute top-2 right-2"
        >{{ row[props.badgeField] }}</Badge>
      </div>
      <div class="flex flex-col gap-1 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm font-medium">{{ row?.[props.titleField] ?? '—' }}</span>
          <Badge
            v-if="!hasMedia && props.badgeField && row?.[props.badgeField] != null"
            class="shrink-0"
          >{{ row[props.badgeField] }}</Badge>
        </div>
        <span v-if="metaOf(row)" class="text-muted-foreground truncate text-xs">{{ metaOf(row) }}</span>
        <slot name="item" :row="row" />
      </div>
    </div>
  </div>
</template>
