/**
 * 标注状态（§14）：用户标注 + 设计说明浮动面板。
 *
 * - 标注持久化到 localStorage（key: pp.annotations.v1），跨刷新保留，可清空。
 * - 设计说明面板位置会话内保留（拖动后记住），首次显示定位视口右上。
 * - 本模块不依赖 app-store / navigation（避免循环），系统上下文由调用方传入；
 *   定位跳转（navigate + 滚动高亮）在 AllAnnotationsDialog 组件内完成。
 */

import { reactive } from 'vue'
import type { ParsedSegment } from './node-path'

export interface Annotation {
  id: string
  system: string
  systemLabel: string
  pageId: string
  pageLabel: string
  /** 仿 XPath 定位路径，如 /app-layout(back-desktop)/工作台(home)/新增用户(btn-add) */
  path: string
  /** 结构化路径段（由路径串解析，供对话框面包屑展示） */
  segments: ParsedSegment[]
  /** 末段显示名（元素名） */
  elementLabel: string
  text: string
  createdAt: string
}

/** 编辑对话框草稿；open = draft !== null */
export interface AnnotationDraft {
  system: string
  systemLabel: string
  pageId: string
  pageLabel: string
  path: string
  /** 结构化路径段（对话框面包屑展示） */
  segments: ParsedSegment[]
  elementLabel: string
  text: string
  /** 已有标注 id（编辑模式，可删除） */
  existingId?: string
}

const STORAGE_KEY = 'pp.annotations.v1'

export const annotationState = reactive({
  /** 设计说明浮动面板；x/y 为 -1 表示未初始化（首次显示时定位视口右上）；dragging 期间标注层暂停 hover 更新 */
  notePanel: { enabled: true, x: -1, y: -1, dragging: false },
  /** 当前悬浮命中的设计说明（AnnotationLayer 随 hover 更新） */
  hoveredNote: null as { path: string; label: string; note: string } | null,
  draft: null as AnnotationDraft | null,
  listOpen: false,
  items: [] as Annotation[],
})

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', { hour12: false })
}

// ---- 标注 CRUD ----

export function openAnnotationDialog(ctx: {
  system: string
  systemLabel: string
  pageId: string
  pageLabel: string
  path: string
  elementLabel: string
  segments: ParsedSegment[]
}): void {
  const existing = annotationState.items.find(
    it => it.system === ctx.system && it.path === ctx.path,
  )
  annotationState.draft = {
    system: ctx.system,
    systemLabel: ctx.systemLabel,
    pageId: ctx.pageId,
    pageLabel: ctx.pageLabel,
    path: ctx.path,
    elementLabel: ctx.elementLabel,
    segments: ctx.segments,
    text: existing?.text ?? '',
    existingId: existing?.id,
  }
}

export function closeAnnotationDialog(): void {
  annotationState.draft = null
}

/** 保存草稿；文字为空时忽略。返回是否写入。 */
export function saveDraft(): boolean {
  const d = annotationState.draft
  const text = d?.text.trim()
  if (!d || !text) return false
  if (d.existingId) {
    const it = annotationState.items.find(i => i.id === d.existingId)
    if (it) it.text = text
  } else {
    annotationState.items.push({
      id: uid(),
      system: d.system,
      systemLabel: d.systemLabel,
      pageId: d.pageId,
      pageLabel: d.pageLabel,
      path: d.path,
      segments: d.segments,
      elementLabel: d.elementLabel,
      text,
      createdAt: new Date().toISOString(),
    })
  }
  persist()
  closeAnnotationDialog()
  return true
}

export function removeAnnotation(id: string): void {
  const i = annotationState.items.findIndex(it => it.id === id)
  if (i >= 0) annotationState.items.splice(i, 1)
  persist()
}

export function clearAnnotations(): void {
  annotationState.items = []
  persist()
}

// ---- 设计说明面板 ----

export function setHoveredNote(note: { path: string; label: string; note: string } | null): void {
  annotationState.hoveredNote = note
}

export function toggleNotePanel(enabled?: boolean): void {
  annotationState.notePanel.enabled = enabled ?? !annotationState.notePanel.enabled
}

export function setNotePanelPosition(x: number, y: number): void {
  annotationState.notePanel.x = x
  annotationState.notePanel.y = y
}

// ---- 持久化 ----

export function loadPersisted(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (Array.isArray(data?.items)) annotationState.items = data.items
  } catch {
    /* 损坏的持久化数据直接忽略 */
  }
}

function persist(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, items: annotationState.items }),
    )
  } catch {
    /* 存储不可用（隐私模式等）时静默降级为会话内标注 */
  }
}

// ---- 导出 / 复制 ----

/** 纯函数：全部标注 → Markdown（按 系统 · 页面 分组） */
export function buildAnnotationsMarkdown(items: Annotation[]): string {
  const lines: string[] = [
    '# 原型标注导出',
    '',
    `- 导出时间：${formatDateTime(new Date().toISOString())}`,
    `- 标注数量：${items.length}`,
  ]
  let lastGroup = ''
  for (const it of items) {
    const group = `${it.systemLabel || it.system} · ${it.pageLabel || it.pageId}`
    if (group !== lastGroup) {
      lines.push('', `## ${group}`)
      lastGroup = group
    }
    lines.push(
      '',
      `### ${it.elementLabel}`,
      `- 路径：\`${it.path}\``,
      `- 时间：${formatDateTime(it.createdAt)}`,
      '',
      it.text,
    )
  }
  return lines.join('\n') + '\n'
}

export function exportAnnotationsMarkdown(): void {
  const md = buildAnnotationsMarkdown(annotationState.items)
  const stamp = new Date().toISOString().slice(0, 10)
  downloadText(`标注导出-${stamp}.md`, md)
}

/** 全部标注列表是否为空 */
export function hasAnnotations(): boolean {
  return annotationState.items.length > 0
}

/** 剪贴板写入：优先 async Clipboard API，降级 execCommand。返回是否成功。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 降级到 execCommand */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

export function downloadText(filename: string, text: string): void {
  if (typeof URL?.createObjectURL !== 'function') return
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
