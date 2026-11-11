<script setup lang="ts">
/**
 * 标注层（§14）：document 级事件委托，负责两件事：
 *  1. 悬浮任意界面元素（带 data-pp-path 探测属性）时，元素右上角出现标注图标，
 *     点击打开标注编辑对话框；
 *  2. 悬浮点命中带设计说明的元素/祖先（data-pp-note）时，更新设计说明面板内容。
 * 图标与面板 Teleport 到 body，不受布局 overflow 裁剪。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { MessageSquarePlusIcon } from 'lucide-vue-next'
import { appState } from '@/framework/app-store'
import {
  annotationState,
  openAnnotationDialog,
  setHoveredNote,
} from '@/framework/annotation-store'
import { parseNodePath } from '@/framework/node-path'
import NotePanel from './NotePanel.vue'
import AnnotationDialog from './AnnotationDialog.vue'
import AllAnnotationsDialog from './AllAnnotationsDialog.vue'

const ICON_SIZE = 22

const rootEl = ref<HTMLElement | null>(null)
const iconVisible = ref(false)
const iconX = ref(0)
const iconY = ref(0)
/** 当前悬浮命中的探测元素（滚动/缩放重定位用） */
let hoverEl: Element | null = null

function positionIcon(rect: DOMRect) {
  const w = (window.innerWidth || 1024) - ICON_SIZE
  const h = (window.innerHeight || 768) - ICON_SIZE
  iconX.value = Math.min(Math.max(rect.right - 10, 0), Math.max(w, 0))
  iconY.value = Math.min(Math.max(rect.top - 10, 0), Math.max(h, 0))
}

function onOver(e: MouseEvent) {
  const target = e.target as Element | null
  if (!target?.closest) return
  // 悬浮在标注层自身（图标/面板）上：保持现状，避免图标逃逸、面板内容抖动
  if (rootEl.value?.contains(target)) return
  // 面板拖动中：暂停 hover 更新
  if (annotationState.notePanel.dragging) return

  const el = target.closest('[data-pp-path]')
  hoverEl = el
  if (el) {
    positionIcon(el.getBoundingClientRect())
    iconVisible.value = true
  } else {
    iconVisible.value = false
  }

  // 设计说明：从悬浮点向上找最近带 note 的祖先
  const noteEl = target.closest('[data-pp-note]')
  if (noteEl) {
    const path = noteEl.getAttribute('data-pp-path') ?? ''
    const last = parseNodePath(path).slice(-1)[0]
    setHoveredNote({
      path,
      label: last ? (last.id ? `${last.name}(${last.id})` : `${last.name}#${last.index}`) : '',
      note: noteEl.getAttribute('data-pp-note') ?? '',
    })
  } else {
    setHoveredNote(null)
  }
}

/** 任意容器滚动 / 视口缩放时，按元素当前 rect 重定位图标 */
function reposition() {
  if (!iconVisible.value || !hoverEl?.isConnected) return
  positionIcon(hoverEl.getBoundingClientRect())
}

function openDialog() {
  if (!hoverEl) return
  const path = hoverEl.getAttribute('data-pp-path') ?? ''
  const last = parseNodePath(path).slice(-1)[0]
  openAnnotationDialog({
    system: appState.system,
    systemLabel: appState.systems.find(s => s.id === appState.system)?.label ?? appState.system,
    pageId: appState.currentPageId,
    pageLabel: appState.currentPageNode?.title ?? appState.currentPageId,
    path,
    elementLabel: last ? (last.id ? `${last.name}(${last.id})` : `${last.name}#${last.index}`) : path,
    segments: parseNodePath(path),
  })
}

onMounted(() => {
  document.addEventListener('mouseover', onOver)
  window.addEventListener('scroll', reposition, { capture: true, passive: true })
  window.addEventListener('resize', reposition)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseover', onOver)
  window.removeEventListener('scroll', reposition, { capture: true } as EventListenerOptions)
  window.removeEventListener('resize', reposition)
})
</script>

<template>
  <Teleport to="body">
    <div ref="rootEl" data-slot="annotation-layer">
      <button
        v-show="iconVisible"
        data-slot="pp-annotate-btn"
        title="添加标注"
        class="bg-primary text-primary-foreground hover:bg-primary/90 fixed z-[60] flex items-center justify-center rounded-full shadow-md transition-transform hover:scale-110"
        :style="{ left: `${iconX}px`, top: `${iconY}px`, width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px` }"
        @click="openDialog"
      >
        <MessageSquarePlusIcon :size="14" />
      </button>
      <NotePanel />
      <AnnotationDialog />
      <AllAnnotationsDialog />
    </div>
  </Teleport>
</template>
