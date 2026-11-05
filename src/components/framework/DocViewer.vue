<script setup lang="ts">
/**
 * doc-viewer（契约组件，套件无关）：文档查看器。
 * PowerPoint 式三栏：左侧缩略图单列（点选切换）+ 中部主视图（上一页/下一页）
 * + 右侧工具区（tools 插槽，可折叠）。props.items: [{ image, label }]（URL 自动内联）。
 */
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from 'lucide-vue-next'

export interface DocViewerItem {
  image: string
  label?: string
}

const props = withDefaults(
  defineProps<{
    items?: DocViewerItem[]
    /** 初始页下标（0 起） */
    defaultPage?: number
    /** 查看器高度（px） */
    height?: number
    /** 工具区标题 */
    toolsTitle?: string
  }>(),
  { defaultPage: 0, height: 560, toolsTitle: '工具' },
)

const current = ref(Math.min(props.defaultPage, Math.max((props.items?.length ?? 1) - 1, 0)))
const toolsOpen = ref(true)

const pages = computed(() => props.items ?? [])
const activeItem = computed(() => pages.value[current.value])

const prev = () => { if (current.value > 0) current.value-- }
const next = () => { if (current.value < pages.value.length - 1) current.value++ }
</script>

<template>
  <div
    data-slot="doc-viewer"
    class="border-border bg-card flex overflow-hidden rounded-lg border"
    :style="{ height: `${props.height}px` }"
  >
    <!-- 左：缩略图导轨（单列画廊，点选切换） -->
    <div class="border-border bg-muted/30 hidden w-44 shrink-0 flex-col gap-2 overflow-y-auto border-r p-2 md:flex">
      <button
        v-for="(it, i) in pages"
        :key="i"
        class="ring-border overflow-hidden rounded-md ring-2 transition-all"
        :class="i === current ? 'ring-primary' : 'hover:ring-primary/40 opacity-75 hover:opacity-100'"
        :data-thumb-index="i"
        @click="current = i"
      >
        <img :src="it.image" :alt="it.label ?? `第 ${i + 1} 页`" class="aspect-[16/9] w-full bg-white object-cover" />
        <span class="text-muted-foreground block px-1 py-0.5 text-center text-[10px] tabular-nums">
          {{ i + 1 }}. {{ it.label ?? '' }}
        </span>
      </button>
    </div>

    <!-- 中：主视图 -->
    <div class="bg-muted/40 flex min-w-0 flex-1 flex-col">
      <div class="border-border flex h-9 shrink-0 items-center justify-between gap-2 border-b px-3 text-xs text-muted-foreground">
        <span class="truncate tabular-nums">{{ current + 1 }} / {{ pages.length }}{{ activeItem?.label ? ` · ${activeItem.label}` : '' }}</span>
        <div class="flex shrink-0 items-center gap-1">
          <button
            class="hover:bg-accent hover:text-foreground flex size-6 cursor-pointer items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="current === 0"
            title="上一页"
            @click="prev"
          ><ChevronLeft class="size-4" /></button>
          <button
            class="hover:bg-accent hover:text-foreground flex size-6 cursor-pointer items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="current >= pages.length - 1"
            title="下一页"
            @click="next"
          ><ChevronRight class="size-4" /></button>
          <template v-if="$slots.tools">
            <span class="bg-border mx-1 h-4 w-px" />
            <button
              class="hover:bg-accent hover:text-foreground flex size-6 cursor-pointer items-center justify-center rounded transition-colors"
              :title="toolsOpen ? '隐藏工具区' : '显示工具区'"
              data-slot="doc-viewer-tools-toggle"
              @click="toolsOpen = !toolsOpen"
            >
              <PanelRightClose v-if="toolsOpen" class="size-4" />
              <PanelRightOpen v-else class="size-4" />
            </button>
          </template>
        </div>
      </div>
      <div class="flex flex-1 items-center justify-center overflow-hidden p-4">
        <img
          v-if="activeItem?.image"
          :src="activeItem.image"
          :alt="activeItem.label ?? ''"
          data-slot="doc-viewer-page"
          class="border-border bg-background max-h-full max-w-full rounded-md border object-contain shadow-sm"
        />
      </div>
    </div>

    <!-- 右：工具区（tools 插槽，可折叠） -->
    <aside v-if="toolsOpen && $slots.tools" class="border-border hidden w-64 shrink-0 flex-col overflow-y-auto border-l lg:flex">
      <div class="border-border text-muted-foreground shrink-0 border-b px-4 py-2 text-[11px] font-medium tracking-wider uppercase">
        {{ props.toolsTitle }}
      </div>
      <div class="flex flex-col gap-3 p-4">
        <slot name="tools" />
      </div>
    </aside>
  </div>
</template>
