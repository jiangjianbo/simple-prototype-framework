/**
 * 类型 → 组件映射决策矩阵（§7.4）
 *
 * 优先级：
 *   1. JSON 显式 component（由渲染器处理，不进本模块）
 *   2. mode === 'preview' 且 string → link
 *   3. mode === 'readonly' → 只读映射表
 *   4. mode === 'disabled' → 编辑映射表 + disabled 注入
 *   5. mode === 'edit'     → 编辑映射表
 *   6. 数组字段在表格中 → table 内部处理多值列
 *   7. 未知类型 → missing-component
 */

import type { Mode } from './types'

const editMap: Record<string, string> = {
  string: 'input',
  number: 'input-number',
  boolean: 'switch',
  Date: 'date-picker',
}

const readonlyMap: Record<string, string> = {
  string: 'text',
  number: 'text',
  boolean: 'boolean-badge',
  Date: 'text',
}

/** 表单类组件：mode=disabled 时自动注入 disabled: true */
export const FORM_LIKE_COMPONENTS = new Set([
  'input',
  'textarea',
  'input-number',
  'switch',
  'checkbox',
  'radio-group',
  'select',
  'date-picker',
  'slider',
  'schema-form',
])

export function resolveFieldComponent(
  fieldType: string,
  mode: Mode = 'edit',
  _context: { inTable?: boolean; inForm?: boolean } = {},
): string {
  if (mode === 'preview' && fieldType === 'string') return 'link'
  if (mode === 'readonly') return readonlyMap[fieldType] ?? 'missing-component'
  return editMap[fieldType] ?? 'missing-component'
}

/** 编辑态字段缺省值（SchemaForm 播种用） */
export function defaultValueFor(type: string, isArray: boolean): any {
  if (isArray) return []
  switch (type) {
    case 'number': return 0
    case 'boolean': return false
    case 'Date': return ''
    default: return ''
  }
}
