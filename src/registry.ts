/**
 * 组件契约注册表（§7.1 / §15）——kebab-case 契约名与 JSON `component` 字段一致。
 *
 * 架构（套件化）：
 *   - 契约名只是「语义槽位」，具体实现由当前套件（Kit）决定，运行时经
 *     resolveComponent(name) 解析；renderer 持有的 registry 是其 Proxy 视图。
 *   - 套件 = Record<契约名, Component> 的部分映射（src/kits/shadcn.ts、src/kits/plain.ts），
 *     未覆盖的契约名回落到默认套件 shadcn（部分覆盖是套件的正式特性）。
 *   - 套件与主题（CSS 变量，src/style.css）正交，可自由组合。
 *
 * 旧名兼容：组件重命名后，旧契约名经 COMPONENT_ALIASES 映射到新名，存量 JSON 不受影响。
 */

import type { Component } from 'vue'
import { kitState, DEFAULT_KIT, type KitMeta } from '@/framework/kit-store'
import { SHADCN_KIT } from '@/kits/shadcn'
import { PLAIN_KIT } from '@/kits/plain'
import { DECKURATE_KIT } from '@/kits/deckurate'

/** 套件清单（顶栏下拉数据源；新增套件 = kits/ 下加映射 + 在此登记） */
export const KIT_LIST: KitMeta[] = [
  { id: 'shadcn', label: '精致 Shadcn', description: 'reka-ui + Tailwind 精致风（圆角、阴影、动效）' },
  { id: 'plain', label: '极简 Plain', description: '原生元素极简风（直角、细边框、无阴影）' },
  { id: 'deckurate', label: 'Deckurate 靛蓝', description: 'Deckurate 组件视觉（胶囊徽标、下划线标签、大写表头、语义色统计卡）' },
]

/** 旧契约名 → 新契约名（重命名兼容层，双向文档见 doc/组件规范.md 附录） */
export const COMPONENT_ALIASES: Record<string, string> = {
  // 历史别名
  tag: 'badge',
  divider: 'separator',
  form: 'schema-form',
  // 2026-11 组件重命名
  'frame-with-title-and-menu-footer': 'app-layout',
  'page-default': 'page-view',
  'menu-tree': 'nav-menu',
  'breadcrumb-auto': 'breadcrumb',
  'field-placeholder': 'field-list',
  'readonly-boolean': 'boolean-badge',
  'fallback-display': 'missing-component',
  // 2026-11 场景布局定名（app-shell → app-layout）
  'app-shell': 'app-layout',
}

const KITS: Record<string, Record<string, Component>> = {
  shadcn: SHADCN_KIT,
  plain: PLAIN_KIT,
  deckurate: DECKURATE_KIT,
}

/**
 * 按当前套件解析契约名：别名归一 → 当前套件 → 默认套件兜底。
 * 读取 kitState.kit（响应式）：在渲染作用域内调用可在切套件时触发重渲染。
 */
export function resolveComponent(name: string): Component | undefined {
  const canonical = COMPONENT_ALIASES[name] ?? name
  const kit = KITS[kitState.kit] ?? KITS[DEFAULT_KIT]
  return kit[canonical] ?? KITS[DEFAULT_KIT][canonical]
}

/**
 * 兼容视图：renderer 等既有代码继续 `registry[name]` 取组件。
 * Proxy 的 get 每次都走 resolveComponent，天然跟随套件切换。
 */
export const registry: Record<string, Component> = new Proxy(
  {} as Record<string, Component>,
  {
    get: (_t, prop: string | symbol) =>
      typeof prop === 'string' ? resolveComponent(prop) : undefined,
    has: (_t, prop: string | symbol) =>
      typeof prop === 'string' && resolveComponent(prop) != null,
  },
)
