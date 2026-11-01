/**
 * 覆盖式导航（§5.4）：@goto 与菜单点击统一入口。
 *
 * 核心规则：目标层级决定覆盖范围。
 *   page → page      仅切换激活页实例（页面均挂在 desktop 树上，无树变更）
 *   → desktop        替换整个 desktop
 *   component 等     向上找到第一个 type === target.type 的祖先（含自身），
 *                    克隆目标放置到其位置（目标原件保留原位）
 *
 * 实现方式：树索引建立在响应式代理上（indexTree(appState.desktop)），
 * 对 children 的写入必须经过 proxy 才能触发重渲染。
 */

import { reactive, toRaw } from 'vue'
import type { Node } from './types'
import { appState, reindex } from './app-store'
import { pushCrumb, resetCrumbs } from './breadcrumb-store'
import { destroyEngines } from './page-engine'

export interface ParentRef {
  parent: Node | null
  list: Node[]
  index: number
}

export interface TreeIndex {
  byId: Map<string, Node>
  parents: WeakMap<Node, ParentRef | null>
  root: Node
}

let treeIndex: TreeIndex | null = null

export function getTreeIndex(): TreeIndex | null {
  return treeIndex
}

export function indexTree(root: Node): TreeIndex {
  const byId = new Map<string, Node>()
  const parents = new WeakMap<Node, ParentRef | null>()
  const walk = (node: Node, ref: ParentRef | null) => {
    parents.set(node, ref)
    if (node.id) byId.set(node.id, node)
    if (Array.isArray(node.children)) {
      node.children.forEach((c, i) => walk(c, { parent: node, list: node.children!, index: i }))
    }
  }
  walk(root, null)
  const idx = { byId, parents, root }
  treeIndex = idx
  return idx
}

export function nodeTypeOf(node: Node): string {
  return node.type ?? 'element'
}

export function findAncestorOfType(index: TreeIndex, node: Node, type: string): Node | null {
  let cur: Node | undefined = node
  while (cur) {
    if (nodeTypeOf(cur) === type) return cur
    cur = index.parents.get(cur)?.parent ?? undefined
  }
  return null
}

export function findFirstPage(root: Node): Node | null {
  if (nodeTypeOf(root) === 'page') return root
  for (const c of root.children ?? []) {
    const found = findFirstPage(c)
    if (found) return found
  }
  return null
}

/** 菜单 / @goto / 面包屑 统一入口 */
export function navigate(targetId: string, sourceNode?: Node) {
  const index = treeIndex
  if (!index || !appState.desktop) return
  const target = index.byId.get(targetId)
  if (!target) {
    console.warn(`[navigate] 目标不存在: ${targetId}`)
    return
  }
  const targetType = nodeTypeOf(target)

  if (targetType === 'desktop') {
    replaceDesktop(toRaw(target))
    return
  }

  // page → page：页面节点始终挂在 desktop 树上，切换激活实例即可（§9.3），
  // 不做树变更——菜单由 menu.json 配置驱动，无需克隆，也不会产生同 id 双渲染。
  if (targetType === 'page') {
    if (appState.currentPageId === targetId && appState.currentPageNode === target) return
    appState.currentPageId = targetId
    appState.currentPageNode = target
    pushCrumb({ pageId: targetId, title: target.title ?? targetId })
    return
  }

  // 非 page 目标（component 等）：覆盖式 = 克隆目标放置到 victim 位置，
  // 目标原件保留原位（其所属页面再次激活时仍完整）。
  let victim: Node | null = null
  if (sourceNode) victim = findAncestorOfType(index, sourceNode, targetType)
  if (!victim) {
    console.warn(`[navigate] 未找到可替换的 ${targetType} 节点（source=${sourceNode?.id ?? '-'} → target=${targetId}）`)
    return
  }
  if (victim === target) return // 幂等

  const victimRef = index.parents.get(victim)
  if (!victimRef) return

  const oldSlot = victim.slot
  const clone = reactive({ ...toRaw(target), slot: oldSlot })
  victimRef.list[victimRef.index] = clone
  reindex()
}

/** 跳转到 desktop：整体替换（跨系统切换由 switchSystem 处理） */
export function replaceDesktop(target: Node) {
  destroyEngines()
  appState.desktop = reactive({ ...target })
  reindex()
  const firstPage = findFirstPage(appState.desktop)
  appState.currentPageId = firstPage?.id ?? ''
  appState.currentPageNode = firstPage
  if (firstPage) {
    resetCrumbs([{ pageId: firstPage.id ?? '', title: firstPage.title ?? firstPage.id ?? '' }])
  }
}
