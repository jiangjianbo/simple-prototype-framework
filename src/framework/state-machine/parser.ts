/**
 * 页面状态机 markdown 真值表解析器（§13.2 – §13.4 / §13.7）
 *
 * 表格结构：
 *   | 组件 / 事件 | 状态A（初始） | 状态B |
 *   |---|---|---|
 *   | ...触发区（@event / .prop 条件） |
 *   | === | === | === |          ← 分区线（整行 ===，必须存在）
 *   | ...响应区（.prop=val / .method()） |
 *
 * 注意：markdown 表格单元格内的 `|` 需写成 `\|`（如逻辑或 `.a==1 \| .b==2`）。
 */

import type { SmIssue, StateMachine } from '../types'

const PROP_RE = /(^|[^\w."'])(\.\w+)/g

/** `.prop` 前缀替换为 `组件.prop` 完整路径（§13.4） */
export function qualify(component: string, expr: string): string {
  return expr.replace(PROP_RE, (_m, prefix: string, prop: string) => prefix + component + prop)
}

type CellKind = 'event' | 'cond' | 'action' | 'empty'

function classify(raw: string, section: 'trigger' | 'response'): CellKind {
  const s = raw.trim()
  if (!s) return 'empty'
  if (s.startsWith('@')) return 'event'
  return section === 'trigger' ? 'cond' : 'action'
}

/** 按未转义的 `|` 切分（`\|` 视为字面量） */
function splitRow(line: string): string[] {
  const PLACEHOLDER = '\u0000'
  const guarded = line.trim().replace(/\|/g, PLACEHOLDER).replace(/\\\|/g, '|')
  return guarded
    .split(PLACEHOLDER)
    .map(c => c.trim())
    .slice(1, -1) // 去掉行首行尾空单元格
}

function isTableDivider(cells: string[]): boolean {
  return cells.length > 0 && cells.every(c => /^:?-{3,}:?$/.test(c))
}

function isSectionDivider(cells: string[]): boolean {
  return cells.length > 0 && cells.every(c => c === '===')
}

const INITIAL_MARKERS = ['（初始）', '(初始)']

export interface SmParseResult {
  sm: StateMachine | null
  issues: SmIssue[]
}

export function parseStateMachine(md: string): SmParseResult {
  const issues: SmIssue[] = []
  const lines = md.split(/\r?\n/).filter(l => l.trim().startsWith('|'))
  if (lines.length < 2) {
    return { sm: null, issues: [{ level: 'error', message: '未找到状态机表格（缺少以 | 开头的表格行）' }] }
  }

  const rows = lines.map(splitRow)

  // 表头
  const header = rows[0]
  if (header[0] !== '组件 / 事件') {
    issues.push({ level: 'warning', message: `表头第一列建议为「组件 / 事件」，当前为「${header[0]}」` })
  }
  const rawStates = header.slice(1)
  let initial = ''
  const states = rawStates.map(raw => {
    const found = INITIAL_MARKERS.find(m => raw.includes(m))
    if (found) {
      if (initial) issues.push({ level: 'error', message: `初始状态重复标注：${raw} 与已有初始状态冲突` })
      initial = raw.replace(found, '').trim()
      return initial
    }
    return raw.trim()
  })
  if (!initial) {
    initial = states[0] ?? ''
    if (states.length) issues.push({ level: 'warning', message: `未标注初始状态，取第一列「${initial}」` })
  }
  if (states.length === 0) {
    return { sm: null, issues: [{ level: 'error', message: '表头状态列为空' }] }
  }
  const dup = states.find((s, i) => states.indexOf(s) !== i)
  if (dup) {
    return { sm: null, issues: [{ level: 'error', message: `状态 id 重复：${dup}` }] }
  }

  // 数据行（跳过分隔行 |---|）
  const dataRows = rows.slice(1).filter(cells => !isTableDivider(cells))

  // 定位 === 分区线
  const sepIdx = dataRows.findIndex(cells => isSectionDivider(cells))
  if (sepIdx === -1) {
    return { sm: null, issues: [{ level: 'error', message: '缺少 === 分区线（触发区与响应区必须分隔）' }] }
  }
  const triggerRows = dataRows.slice(0, sepIdx)
  const responseRows = dataRows.slice(sepIdx + 1)

  const events: Record<string, Record<string, string[]>> = {}
  const conds: Record<string, Record<string, string>> = {}
  const actions: Record<string, Record<string, string[]>> = {}
  const componentIds = new Set<string>()

  for (const cells of triggerRows) {
    const component = cells[0]
    if (!component) continue
    componentIds.add(component)
    for (let i = 1; i < cells.length; i++) {
      const state = states[i - 1]
      if (!state) continue
      const cell = cells[i]
      const kind = classify(cell, 'trigger')
      if (kind === 'event') {
        const ev = cell.trim().slice(1).trim()
        if (!ev) continue
        ;(events[state] ??= {})[component] ??= []
        events[state][component].push(ev)
      } else if (kind === 'cond') {
        if (conds[state]?.[component]) {
          issues.push({ level: 'error', message: `同一状态下同一组件出现多行条件：${state} / ${component}` })
        }
        ;(conds[state] ??= {})[component] = qualify(component, cell.trim())
      }
    }
  }

  const seenResponse = new Set<string>()
  for (const cells of responseRows) {
    const component = cells[0]
    if (!component) continue
    componentIds.add(component)
    for (let i = 1; i < cells.length; i++) {
      const state = states[i - 1]
      if (!state) continue
      const kind = classify(cells[i], 'response')
      if (kind === 'action') {
        const key = `${state}\u0000${component}`
        if (seenResponse.has(key)) {
          issues.push({ level: 'error', message: `同一状态下响应区对同一组件出现多行：${state} / ${component}` })
        }
        seenResponse.add(key)
        const stmts = cells[i]
          .split(';')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => qualify(component, s))
        ;(actions[state] ??= {})[component] = stmts
      }
    }
  }

  const sm: StateMachine = {
    states,
    initial,
    trigger: { events, conds },
    response: { actions },
    componentIds: [...componentIds],
  }
  return { sm, issues }
}

/** 加载期静态校验（§13.8）：表达式引用的组件 id 不在页面 JSON 中按警告处理（按虚拟组件播种） */
export function validateAgainstPage(sm: StateMachine, pageNodeIds: Set<string>): SmIssue[] {
  const issues: SmIssue[] = []
  for (const id of sm.componentIds) {
    if (!pageNodeIds.has(id)) {
      issues.push({ level: 'warning', message: `状态机引用的组件 id「${id}」不在页面 JSON 中（按虚拟组件处理，reset() 将重置全部绑定）` })
    }
  }
  return issues
}
