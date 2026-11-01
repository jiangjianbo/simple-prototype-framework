/**
 * 运行时元数据访问层（§6.5 嵌套路径展开）
 *
 * metadata.json 由构建期 ts-morph 扫描产出，键为 `{system}.{TypeName}`。
 * JSON 中写 `@@User` 时按当前系统自动加前缀查表。
 */

import type { FieldMeta, MetadataRegistry, TypeMeta } from './types'

let registry: MetadataRegistry = {}

export function setMetadata(meta: MetadataRegistry) {
  registry = meta ?? {}
}

export function getMetadata(): MetadataRegistry {
  return registry
}

export function getTypeMeta(key: string): TypeMeta | undefined {
  return registry[key]
}

/** 供组件（如 DataTable column 配置）按 `@@User.roles.name` 展开字段 */
export function expandTypeRef(ref: string, system: string): FieldMeta[] {
  if (!ref.startsWith('@@')) return []
  const body = ref.slice(2)
  const dot = body.indexOf('.')
  const typeName = dot === -1 ? body : body.slice(0, dot)
  const path = dot === -1 ? [] : body.slice(dot + 1).split('.')
  const meta = registry[`${system}.${typeName}`] ?? registry[typeName]
  if (!meta) {
    console.warn(`[metadata] 未找到类型 ${system}.${typeName}（引用: ${ref}），请先运行 gen:metadata`)
    return []
  }
  return expandPath(meta, path)
}

/**
 * `expandPath(rootType, path)`（§6.5）：
 *   path 为空      → 全部字段
 *   path 一级      → 该字段本身
 *   path 多级      → 递归下钻；穿过数组时标记 inArray / arraySource
 */
export function expandPath(typeMeta: TypeMeta, path: string[]): FieldMeta[] {
  const [head, ...rest] = path
  if (!head) return typeMeta.fields

  const field = typeMeta.fields.find(f => f.name === head)
  if (!field) return []

  if (rest.length === 0) return [field]

  const refType = field.type
  const nestedMeta = registry[refType]
  if (nestedMeta) {
    const nested = expandPath(nestedMeta, rest)
    return field.isArray
      ? nested.map(n => ({ ...n, inArray: true, arraySource: head }))
      : nested
  }
  console.warn(`[metadata] 字段 ${typeMeta.name}.${head} 的类型 ${refType} 不在元数据中，无法下钻 ${rest.join('.')}`)
  return []
}

/** 引用类型判定（带系统前缀，如 back.Role） */
export function isRefType(type: string): boolean {
  return !['string', 'number', 'boolean', 'Date', 'null', 'undefined'].includes(type)
}
