/**
 * 页面状态机的加载期解析 + 每页引擎缓存。
 *
 * - 加载期（loadSystem）：拉取 .sm.md → parseStateMachine → 静态校验（§13.8），
 *   结果挂在 page 节点 __sm 上。
 * - 渲染期：页面首次渲染时 ensurePageEngine 播种 scope 并创建引擎。
 */

import { shallowRef } from 'vue'
import type { Node, SmIssue, StateMachine } from './types'
import { fetchText } from './resolver'
import { parseStateMachine, validateAgainstPage } from './state-machine/parser'
import { createBinding, createPageEngine, type PageEngine } from './state-machine/engine'
import { FORM_LIKE_COMPONENTS } from './field-mapper'

export const currentPageEngine = shallowRef<PageEngine | null>(null)

const engineCache = new Map<string, PageEngine>()

export function destroyEngines() {
  engineCache.clear()
  currentPageEngine.value = null
}

export interface SmParseEntry {
  sm: StateMachine | null
  issues: SmIssue[]
}

/** 加载期：解析页面引用的所有 .sm.md 并做静态检查 */
export async function resolveStateMachines(root: Node) {
  const walk = async (node: Node) => {
    if (Array.isArray(node.children)) {
      for (const c of node.children) await walk(c)
    }
    if ((node.type ?? 'element') !== 'page') return
    const sources: string[] = node.__smSrc ?? []
    if (!sources.length) return
    const entries: SmParseEntry[] = []
    const pageIds = new Set<string>()
    collectIds(node, pageIds)
    for (const src of sources) {
      try {
        const md = await fetchText(src)
        const { sm, issues } = parseStateMachine(md)
        if (sm) issues.push(...validateAgainstPage(sm, pageIds))
        entries.push({ sm, issues })
      } catch (e) {
        entries.push({ sm: null, issues: [{ level: 'error', message: `状态机文件加载失败 ${src}: ${(e as Error).message}` }] })
      }
    }
    node.__sm = entries
  }
  await walk(root)
}

function collectIds(node: Node, out: Set<string>) {
  if (node.id) out.add(node.id)
  for (const c of node.children ?? []) collectIds(c, out)
}

function findNodeById(node: Node, id: string): Node | null {
  if (node.id === id) return node
  for (const c of node.children ?? []) {
    const found = findNodeById(c, id)
    if (found) return found
  }
  return null
}

/** 多表逃生口（§13.6.2）：合并为单引擎（状态 id 冲突视为错误） */
function mergeEntries(entries: SmParseEntry[]): { sm: StateMachine | null; issues: SmIssue[] } {
  const issues: SmIssue[] = []
  const valid = entries.filter(e => e.sm)
  for (const e of entries) issues.push(...e.issues)
  if (valid.length === 0) return { sm: null, issues }
  if (valid.length === 1) return { sm: valid[0].sm, issues }

  const base = valid[0].sm!
  const merged: StateMachine = {
    states: [...base.states],
    initial: base.initial,
    trigger: { events: { ...base.trigger.events }, conds: { ...base.trigger.conds } },
    response: { actions: { ...base.response.actions } },
    componentIds: [...base.componentIds],
  }
  for (const e of valid.slice(1)) {
    const sm = e.sm!
    for (const s of sm.states) {
      if (merged.states.includes(s)) {
        issues.push({ level: 'error', message: `多表状态 id 冲突：${s}` })
        continue
      }
      merged.states.push(s)
      merged.trigger.events[s] = sm.trigger.events[s] ?? {}
      merged.trigger.conds[s] = sm.trigger.conds[s] ?? {}
      merged.response.actions[s] = sm.response.actions[s] ?? {}
    }
    merged.componentIds.push(...sm.componentIds)
  }
  console.info('[state-machine] 检测到多表声明，已合并为单引擎（原型阶段简化实现）')
  return { sm: merged, issues }
}

/** 渲染期：页面首次渲染时创建引擎（每页缓存） */
export function ensurePageEngine(pageNode: Node): PageEngine | null {
  const pageId = pageNode.id ?? ''
  if (!pageId) return null
  const cached = engineCache.get(pageId)
  if (cached) {
    currentPageEngine.value = cached
    return cached
  }
  const entries: SmParseEntry[] = pageNode.__sm ?? []
  const { sm, issues } = mergeEntries(entries)
  if (!sm) {
    const engine = createPageEngine(
      { states: [], initial: '', trigger: { events: {}, conds: {} }, response: { actions: {} }, componentIds: [] },
      {},
    )
    engine.issues = issues
    engineCache.set(pageId, engine)
    currentPageEngine.value = engine
    return engine
  }

  // 播种 scope：为状态机涉及的每个组件 id 建立响应式绑定
  const scope: Record<string, any> = {}
  const realBindings: Record<string, any>[] = []
  for (const id of sm.componentIds) {
    const node = findNodeById(pageNode, id)
    let seed: Record<string, any> = {}
    if (node) {
      if (node.value != null && typeof node.value === 'object' && !Array.isArray(node.value)) {
        seed = { ...node.value }
      } else if (node.value !== undefined) {
        seed = { value: node.value }
      } else if (FORM_LIKE_COMPONENTS.has(node.component)) {
        seed = { value: '' }
      } else if (node.text != null) {
        seed = { text: node.text }
      }
    }
    scope[id] = createBinding(seed)
    if (node) realBindings.push(scope[id])
  }
  // 虚拟组件（无对应节点，如 doc 示例中的 form.reset()）→ 重置全部实体绑定。
  // 不能把虚拟组件自身算进去，否则 reset 会递归调用自己（栈溢出）。
  for (const id of sm.componentIds) {
    if (!findNodeById(pageNode, id)) {
      scope[id].reset = () => {
        for (const b of realBindings) b.reset()
      }
    }
  }
  // $xxx 系统常量与页面常量注入 scope
  Object.assign(scope, pageNode.constants ?? {})

  const engine = createPageEngine(sm, scope)
  engine.issues = issues
  engineCache.set(pageId, engine)
  currentPageEngine.value = engine
  return engine
}
