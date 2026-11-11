<script setup lang="ts">
/**
 * 全部标注对话框（§14）：按 系统 · 页面 分组列出所有标注。
 * 每条可「定位」（切页后按 data-pp-path 找到元素，滚动并高亮）与「删除」；
 * 底部支持复制全部（Markdown）、导出 .md 文件、清空。
 */
import { ref, computed } from 'vue'
import { CrosshairIcon } from 'lucide-vue-next'
import { appState } from '@/framework/app-store'
import { navigate } from '@/framework/navigation'
import {
  annotationState,
  clearAnnotations,
  removeAnnotation,
  exportAnnotationsMarkdown,
  copyText,
  buildAnnotationsMarkdown,
  formatDateTime,
  type Annotation,
} from '@/framework/annotation-store'
import { resolveComponent } from '@/registry'
import { Dialog } from '@/components/ui/dialog'

const ButtonCmp = resolveComponent('button')!

const groups = computed(() => {
  const map = new Map<string, { label: string; items: Annotation[] }>()
  for (const it of annotationState.items) {
    const key = `${it.system}::${it.pageId}`
    if (!map.has(key)) {
      map.set(key, { label: `${it.systemLabel || it.system} · ${it.pageLabel || it.pageId}`, items: [] })
    }
    map.get(key)!.items.push(it)
  }
  return [...map.values()]
})

/** data-pp-path 属性选择器（转义引号；CSS.escape 在 jsdom 不可用时兜底） */
function attrSelector(path: string): string {
  return `[data-pp-path="${path.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
}

/** 定位：关闭对话框 → 切页 → 找到探测元素 → 滚动居中 + 临时高亮 */
async function locate(it: Annotation) {
  annotationState.listOpen = false
  if (appState.currentPageId !== it.pageId) {
    navigate(it.pageId)
  }
  await new Promise(r => setTimeout(r, 50))
  const el = document.querySelector(attrSelector(it.path))
  if (!el) return
  ;(el as HTMLElement).scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  el.classList.add('pp-locate-flash')
  setTimeout(() => el.classList.remove('pp-locate-flash'), 2000)
}

const copied = ref(false)
async function copyAll() {
  copied.value = await copyText(buildAnnotationsMarkdown(annotationState.items))
  if (copied.value) setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <Dialog
    :open="annotationState.listOpen"
    title="全部标注"
    :description="`共 ${annotationState.items.length} 条标注`"
    class="max-w-2xl"
    @update:open="(v: boolean) => { annotationState.listOpen = v }"
  >
    <div data-slot="all-annotations" class="grid gap-4">
      <div v-if="!annotationState.items.length" class="text-muted-foreground py-8 text-center text-sm">
        还没有标注。悬浮到任意界面元素，点击出现的标注图标即可添加。
      </div>

      <div v-else class="grid gap-4">
        <section
          v-for="g in groups"
          :key="g.label"
          class="grid gap-2"
        >
          <h3 class="text-muted-foreground text-xs font-medium">{{ g.label }}</h3>
          <div
            v-for="it in g.items"
            :key="it.id"
            :data-annotation-id="it.id"
            class="rounded-md border p-3"
          >
            <div class="flex items-center gap-2">
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ it.elementLabel }}</span>
              <component
                :is="ButtonCmp"
                variant="ghost"
                size="sm"
                :title="`定位到「${it.elementLabel}」`"
                @click="locate(it)"
              >
                <CrosshairIcon class="size-3.5" /> 定位
              </component>
              <component
                :is="ButtonCmp"
                variant="ghost"
                size="sm"
                class="text-destructive"
                @click="removeAnnotation(it.id)"
              >删除</component>
            </div>
            <div class="text-muted-foreground mt-1 truncate font-mono text-xs" :title="it.path">{{ it.path }}</div>
            <p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{{ it.text }}</p>
            <div class="text-muted-foreground/70 mt-2 text-xs">{{ formatDateTime(it.createdAt) }}</div>
          </div>
        </section>
      </div>

      <div class="text-muted-foreground flex items-center gap-2 border-t pt-4">
        <template v-if="annotationState.items.length">
          <component :is="ButtonCmp" variant="outline" size="sm" data-slot="annotations-copy" @click="copyAll">
            {{ copied ? '已复制' : '复制全部' }}
          </component>
          <component :is="ButtonCmp" variant="outline" size="sm" data-slot="annotations-export" @click="exportAnnotationsMarkdown">
            导出 .md
          </component>
          <component :is="ButtonCmp" variant="ghost" size="sm" class="text-destructive" @click="clearAnnotations">
            清空
          </component>
        </template>
        <component
          :is="ButtonCmp"
          variant="primary"
          size="sm"
          class="ml-auto"
          @click="annotationState.listOpen = false"
        >完成</component>
      </div>
    </div>
  </Dialog>
</template>
