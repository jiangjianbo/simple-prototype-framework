/**
 * 引用解析（设计文档 §4.3 / §8）
 *
 * 四种前缀：
 *   @@Type / @@Type.field.path —— 类型元数据引用（渲染期查 metadata）
 *   @attr                      —— 节点属性引用（沿节点树向上查找）
 *   /path/file.json            —— 文件内容引用（加载期内联）
 *   @/a/b.png                  —— 本地资源引用（渲染期解析为系统 assets URL）
 *
 * 约定：`/` 文件引用书写为完整 Web 路径，与仓库内 systems/ 目录一一对应
 *（systems/back/... ⇔ /systems/back/...），例如 /systems/back/back.menu.json。
 */

import type { Node } from './types'
import { getBootstrap } from './static-bootstrap'

/** 允许做 `/` 文件内联的属性（设计文档仅定义 data，此处按需扩展） */
export const FILE_REF_PROPS = ['data', 'rows', 'value', 'items', 'options'] as const

export function isTypeRef(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('@@')
}

export function isAttrRef(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('@') && !v.startsWith('@/') && !v.startsWith('@@')
}

export function isAssetRef(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('@/')
}

export function isFileRef(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('/')
}

/** `@/brain.png` → `/systems/{system}/assets/brain.png`；静态模式命中内嵌 data URL */
export function resolveAssetUrl(ref: string, system: string): string {
  const name = ref.slice(2)
  const embedded = getBootstrap()?.assets[`${system}/${name}`]
  return embedded ?? `/systems/${system}/assets/${name}`
}

/** `@attr` 属性查找：当前节点 → 逐级向上 */
export function resolveAttr(path: string, node: Node, scopeStack: Node[]): any {
  if (path in node) return node[path]
  for (let i = scopeStack.length - 1; i >= 0; i--) {
    const n = scopeStack[i]
    if (path in n) return n[path]
  }
  return undefined
}

async function fetchJson(url: string): Promise<any> {
  // 静态构建模式：全部内容内嵌在页面 bootstrap 里，不发网络请求（file:// 可直开）
  const embedded = getBootstrap()?.files[url]
  if (embedded != null) return JSON.parse(embedded)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载失败 ${url}: ${res.status}`)
  return res.json()
}

async function fetchText(url: string): Promise<string> {
  const embedded = getBootstrap()?.files[url]
  if (embedded != null) return embedded
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载失败 ${url}: ${res.status}`)
  return res.text()
}

export { fetchJson, fetchText }

/**
 * 加载阶段预处理：把节点树中的 `/file.json` 引用内联为文件内容。
 * 递归处理 children 与 column 数组（column 为配置型子节点）。
 */
export async function preprocessNode(node: any, depth = 0): Promise<any> {
  if (node == null) return node
  if (Array.isArray(node)) {
    const out = []
    for (const n of node) out.push(await preprocessNode(n, depth))
    return out
  }
  if (typeof node !== 'object') return node
  if (depth > 32) throw new Error('文件引用嵌套过深（可能存在循环引用）')

  const out: Record<string, any> = { ...node }

  for (const prop of FILE_REF_PROPS) {
    const v = out[prop]
    if (isFileRef(v)) {
      out[prop] = await fetchJson(v)
    } else if (prop === 'value' && v && typeof v === 'object' && !Array.isArray(v)) {
      // value 对象内允许 rows/items 子引用，一并内联
      for (const [k, kv] of Object.entries(v)) {
        if (isFileRef(kv)) out[prop] = { ...out[prop], [k]: await fetchJson(kv) }
      }
    }
  }

  if (typeof out.stateMachine === 'string' && out.stateMachine.startsWith('/')) {
    // 保留原始路径（统一为数组），由状态机模块在加载期解析为 AST
    out.__smSrc = [out.stateMachine]
  } else if (Array.isArray(out.stateMachine)) {
    out.__smSrc = out.stateMachine.map((e: any) => e.src).filter((s: any) => typeof s === 'string')
  }

  if (out.children) out.children = await preprocessNode(out.children, depth + 1)
  if (Array.isArray(out.column)) out.column = await preprocessNode(out.column, depth + 1)
  return out
}
