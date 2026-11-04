/**
 * 递归渲染核心（§5.2）
 *
 * 职责：
 *   - 未知组件兜底 missing-component
 *   - data 引用解析（@@ 元数据 / @ 属性 / @/ 资源；/ 文件引用已在加载期内联）
 *   - mode 继承与覆盖、disabled 自动注入
 *   - @goto 与状态机事件注入（onClick / onUpdate:modelValue）
 *   - 容器节点按 slot 分组投递；element 不递归
 *   - page 节点仅渲染当前激活页（§9.3）
 *   - table 的 column 配置型子节点拆分：字段引用 → 列配置，其余 → toolbar 插槽
 */

import { computed, defineComponent, h, inject, provide, type PropType, type VNode } from 'vue'
import type { Node, RenderContext } from './types'
import { appState } from './app-store'
import { registry } from '@/registry'
import { FORM_LIKE_COMPONENTS } from './field-mapper'
import { expandTypeRef } from './metadata'
import { isAttrRef, isAssetRef, isTypeRef, resolveAssetUrl, resolveAttr } from './resolver'
import { navigate } from './navigation'
import { ensurePageEngine } from './page-engine'
import FallbackDisplay from '@/components/framework/MissingComponent.vue'

export const MODE_KEY: any = Symbol('pp-mode')
export const CTX_KEY: any = Symbol('pp-ctx')

type VSlotMap = Record<string, () => VNode[]>

/** 不透传为 props 的框架元字段 */
const META_KEYS = new Set([
  'type', 'component', 'slot', 'children', 'data', 'mode', '@goto',
  'stateMachine', 'constants', '__smSrc', '__sm', 'column',
])

/** 内部消化 children 的复合组件（不走插槽分发） */
const INTERNAL_CHILDREN = new Set(['tabs'])

/** 接受 modelValue 的受控组件 */
const CONTROL_COMPONENTS = new Set([
  'input', 'textarea', 'input-number', 'switch', 'checkbox', 'select',
  'radio-group', 'date-picker', 'slider', 'schema-form',
])

export function renderNode(node: Node, ctx: RenderContext): VNode | null {
  // 缺省视为 component（可含 children）；仅显式 "type": "element" 才是叶子（§4.1）
  const nodeType = node.type ?? 'component'

  // 页面激活规则（§9.3）：只渲染当前激活 page（按实例匹配，克隆导航后同 id 原件不渲染）
  if (nodeType === 'page') {
    const currentNode = appState.currentPageNode
    const active = currentNode ? node === currentNode : node.id === appState.currentPageId
    if (!active) return null
  }

  // 页面级状态机：惰性创建引擎
  let engine = ctx.engine ?? null
  if (nodeType === 'page' && node.__sm) {
    engine = ensurePageEngine(node)
  }

  const binding = node.id && engine?.hasComponent(node.id) ? engine.binding(node.id) : null
  if (binding && binding.visible === false) return null

  const impl = registry[node.component]
  if (!impl) return h(FallbackDisplay, { message: `[未知组件: ${node.component}]` })

  // 透传 props（剔除框架元字段）
  const props: Record<string, any> = {}
  for (const [k, v] of Object.entries(node)) {
    if (META_KEYS.has(k)) continue
    props[k] = v
  }

  // ---- data 引用解析（model 为 data 的别名，如表单 model="@@Profile"）----
  let data = node.data ?? node.model
  if (typeof data === 'string') {
    if (isTypeRef(data)) {
      const fields = expandTypeRef(data, ctx.system)
      props.fields = fields
      data = fields
    } else if (isAssetRef(data)) {
      data = resolveAssetUrl(data, ctx.system)
    } else if (isAttrRef(data)) {
      data = resolveAttr((data as string).slice(1), node, ctx.scope)
    }
  }
  props.data = data

  // ---- mode 继承与 disabled 注入（§5.3 / §7.4）----
  const mode = node.mode ?? ctx.mode ?? 'edit'
  props.mode = mode
  if (mode === 'disabled' && FORM_LIKE_COMPONENTS.has(node.component)) props.disabled = true

  // ---- 状态机绑定合并 ----
  if (binding) {
    if (binding.enabled === false) props.disabled = true
    if (binding.readOnly === true && FORM_LIKE_COMPONENTS.has(node.component)) props.disabled = true
    if (binding.text != null) props.text = binding.text
    if ('value' in binding && CONTROL_COMPONENTS.has(node.component)) {
      props.modelValue = binding.value
      props['onUpdate:modelValue'] = (v: any) => {
        binding.value = v
        engine!.onEvent(node.id!, 'change')
      }
    }
  }

  // ---- @goto / 状态机事件 → onClick ----
  const handlers: Array<() => void> = []
  const goto = node['@goto']
  if (goto) handlers.push(() => navigate(goto, node))
  if (binding && engine?.declaresEvent(node.id!, 'click')) {
    handlers.push(() => engine!.onEvent(node.id!, 'click'))
  }
  if (handlers.length) props.onClick = () => handlers.forEach(fn => fn())

  // ---- element：叶子，不递归 children ----
  if (nodeType === 'element') return h(impl as any, props)

  // ---- 容器：递归 children ----
  const childCtx: RenderContext = { ...ctx, mode, scope: [...ctx.scope, node], engine }
  const slots: VSlotMap = {}

  // table 的配置型子节点（§4.2）：column 数组拆分为列配置 + toolbar
  if (node.component === 'table' && Array.isArray(node.column)) {
    const colConfigs: any[] = []
    const toolbarNodes: Node[] = []
    for (const entry of node.column) {
      if (entry && typeof entry === 'object' && (isTypeRef(entry.data) || typeof entry.field === 'string')) {
        if (isTypeRef(entry.data)) {
          for (const f of expandTypeRef(entry.data, childCtx.system)) {
            colConfigs.push({ field: f.name, meta: f, label: f.label })
          }
        } else if (isTypeRef(entry.field)) {
          // field: "@@Order.amount" 单字段引用 → 取该字段元数据（label 与类型感知格式化）
          const meta = expandTypeRef(entry.field, childCtx.system)[0]
          colConfigs.push({
            field: meta?.name ?? entry.field.split('.').pop()!,
            label: entry.label ?? meta?.label ?? entry.field,
            meta,
            align: entry.align,
            width: entry.width,
          })
        } else {
          colConfigs.push({ field: entry.field, label: entry.label ?? entry.field, align: entry.align, width: entry.width })
        }
      } else {
        toolbarNodes.push(entry)
      }
    }
    props.columns = colConfigs
    if (toolbarNodes.length) {
      slots.toolbar = () => toolbarNodes.map(n => renderNode(n, childCtx)).filter(Boolean) as VNode[]
    }
  }

  if (INTERNAL_CHILDREN.has(node.component)) {
    props.__nodes = node.children ?? []
    return h(impl as any, props)
  }

  const groups = new Map<string, Node[]>()
  for (const c of node.children ?? []) {
    const s = c.slot ?? 'default'
    if (!groups.has(s)) groups.set(s, [])
    groups.get(s)!.push(c)
  }
  for (const [name, children] of groups) {
    slots[name] = () =>
      children.map(c => h(NodeRenderer, { node: c, ctx: childCtx })).filter(Boolean) as VNode[]
  }
  return h(impl as any, props, slots)
}

/**
 * 递归渲染组件：每个节点一个组件实例，
 * 使 provide/inject（mode 传播）与响应式更新自然生效。
 */
export const NodeRenderer = defineComponent({
  name: 'NodeRenderer',
  props: {
    node: { type: Object as PropType<Node>, required: true },
    ctx: { type: Object as PropType<RenderContext>, required: true },
  },
  setup(props) {
    provide(MODE_KEY, computed(() => props.ctx.mode))
    provide(CTX_KEY, props.ctx)
    return () => renderNode(props.node, props.ctx)
  },
})

/** 供复合组件（如 tabs）内部渲染子节点时取渲染上下文 */
export function useRenderCtx(): RenderContext {
  return inject(CTX_KEY) as RenderContext
}
