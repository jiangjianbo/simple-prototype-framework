<script setup lang="ts">
/**
 * 设计说明浮动框（§14）：显示当前悬浮元素的设计说明（page.json 的 note 字段）。
 * 标题栏可拖动、可关闭；关闭后由顶栏「设计说明」按钮重新打开。
 * 位置存 annotation-store（会话内保留），首次显示定位视口右上。
 */
import { ref, onMounted } from 'vue'
import { StickyNoteIcon, XIcon } from 'lucide-vue-next'
import { appState } from '@/framework/app-store'
import {
  annotationState,
  setNotePanelPosition,
  toggleNotePanel,
} from '@/framework/annotation-store'

const DEFAULT_WIDTH = 320

const el = ref<HTMLElement | null>(null)

onMounted(() => {
  if (annotationState.notePanel.x < 0) {
    const w = window.innerWidth || 1024
    const h = window.innerHeight || 768
    setNotePanelPosition(Math.max(w - DEFAULT_WIDTH - 24, 8), Math.min(64, Math.max(h - 120, 8)))
  }
})

/** 标题栏拖动：mousedown 后在 document 上跟踪 mousemove，直到 mouseup */
function onHeaderDown(e: MouseEvent) {
  annotationState.notePanel.dragging = true
  const offsetX = e.clientX - annotationState.notePanel.x
  const offsetY = e.clientY - annotationState.notePanel.y
  const move = (ev: MouseEvent) => {
    const w = window.innerWidth || 1024
    const h = window.innerHeight || 768
    const pw = el.value?.offsetWidth || DEFAULT_WIDTH
    const ph = el.value?.offsetHeight || 120
    setNotePanelPosition(
      Math.min(Math.max(ev.clientX - offsetX, 0), Math.max(w - pw, 0)),
      Math.min(Math.max(ev.clientY - offsetY, 0), Math.max(h - ph, 0)),
    )
  }
  const up = () => {
    annotationState.notePanel.dragging = false
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}
</script>

<template>
  <div
    v-if="annotationState.notePanel.enabled && appState.status === 'ready'"
    ref="el"
    data-slot="note-panel"
    class="bg-popover text-popover-foreground fixed z-[60] w-80 rounded-lg border shadow-lg"
    :style="{ left: `${annotationState.notePanel.x}px`, top: `${annotationState.notePanel.y}px` }"
  >
    <div
      data-slot="note-panel-header"
      class="flex cursor-move items-center gap-2 border-b px-3 py-2 select-none"
      @mousedown="onHeaderDown"
    >
      <StickyNoteIcon class="text-muted-foreground size-4 shrink-0" />
      <span class="text-sm font-medium">设计说明</span>
      <span v-if="annotationState.hoveredNote" class="text-muted-foreground min-w-0 flex-1 truncate text-xs">
        {{ annotationState.hoveredNote.label }}
      </span>
      <span v-else class="flex-1" />
      <button
        data-slot="note-panel-close"
        title="关闭（可从顶栏「设计说明」重新打开）"
        class="text-muted-foreground hover:text-foreground shrink-0 rounded-sm p-0.5"
        @click="toggleNotePanel(false)"
      >
        <XIcon class="size-4" />
      </button>
    </div>
    <div data-slot="note-panel-body" class="max-h-60 overflow-y-auto px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
      <template v-if="annotationState.hoveredNote">{{ annotationState.hoveredNote.note }}</template>
      <span v-else class="text-muted-foreground">
        将鼠标悬浮到带设计说明的界面元素上，这里会显示对应的说明文字。
      </span>
    </div>
  </div>
</template>
