/**
 * 节点定位路径（标注功能 §14）：仿 XPath 的树状路径。
 *
 * 段格式：有 id → `名称(id)`；无 id → `名称#序号`（同组件兄弟序号，1 起）。
 * 名称优先级：title → label → component 契约名。
 * 完整路径形如：/app-layout(back-desktop)/安全概览(dashboard)/新增用户(btn-add)
 *
 * 渲染期由 renderer 写入 data-pp-path 探测属性；标注层悬浮时按该属性
 * 定位元素、回溯路径；parseNodePath 负责把路径串解析回结构化段。
 */

import type { Node, NodeType } from './types'

export interface PathSegment {
  /** 显示名：title → label → component */
  name: string
  /** 组件契约名 */
  component: string
  kind: NodeType
  id?: string
  /** 同组件兄弟序号（1 起） */
  index: number
}

/** 解析后的段（来自路径串，component 无法还原，kind 按位置推断） */
export interface ParsedSegment {
  name: string
  id?: string
  index: number
  kind: 'desktop' | 'page' | 'node'
}

export interface NodePath {
  segments: PathSegment[]
  /** 以 / 开头的完整路径串 */
  path: string
  /** 末段显示名（元素名） */
  label: string
}

const cache = new WeakMap<Node, NodePath>()

function segmentName(node: Node): string {
  if (typeof node.title === 'string' && node.title) return node.title
  if (typeof node.label === 'string' && node.label) return node.label
  return node.component
}

function segmentText(seg: PathSegment): string {
  return seg.id ? `${seg.name}(${seg.id})` : `${seg.name}#${seg.index}`
}

/** 渲染期构建节点路径；scope 为祖先链（RenderContext.scope，不含 node 本身） */
export function buildNodePath(scope: Node[], node: Node): NodePath {
  const hit = cache.get(node)
  if (hit) return hit

  const chain = [...scope, node]
  const segments: PathSegment[] = chain.map((n, i) => {
    const parent = i > 0 ? chain[i - 1] : null
    const siblings = (Array.isArray(parent?.children) ? parent!.children : []) as Node[]
    let index = 1
    for (const s of siblings) {
      if (s === n) break
      if (s.component === n.component) index++
    }
    return {
      name: segmentName(n),
      component: n.component,
      kind: n.type ?? 'component',
      id: typeof n.id === 'string' && n.id ? n.id : undefined,
      index,
    }
  })
  const label = segmentText(segments[segments.length - 1])
  const result: NodePath = { segments, path: '/' + segments.map(segmentText).join('/'), label }
  cache.set(node, result)
  return result
}

/** 把路径串解析回结构化段（component 与精确 kind 在串中不可还原，按位置推断） */
export function parseNodePath(path: string): ParsedSegment[] {
  return path
    .split('/')
    .filter(Boolean)
    .map((raw, i) => {
      const paren = raw.match(/^(.*?)\(([^()]*)\)$/)
      if (paren) {
        return {
          name: paren[1],
          id: paren[2],
          index: 1,
          kind: i === 0 ? 'desktop' : i === 1 ? 'page' : 'node',
        }
      }
      const hash = raw.match(/^(.*?)#(\d+)$/)
      if (hash) {
        return {
          name: hash[1],
          index: Number(hash[2]) || 1,
          kind: i === 0 ? 'desktop' : i === 1 ? 'page' : 'node',
        }
      }
      return { name: raw, index: 1, kind: i === 0 ? 'desktop' : i === 1 ? 'page' : 'node' }
    })
}
