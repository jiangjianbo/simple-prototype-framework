/**
 * plain 套件 · 无逻辑原子组件（契约同 shadcn 版：props.text / slot 默认出口 / class 合并）。
 * 视觉语言：直角、细边框、无阴影、无圆角 —— 与主题 CSS 变量完全兼容。
 */

import { defineComponent, h, type Component } from 'vue'

interface PrimOptions {
  /** 根元素标签（缺省 div） */
  tag?: string
  /** 附加静态类 */
  extraClass?: string
}

function prim(name: string, cls: string, opts: PrimOptions = {}): Component {
  return defineComponent({
    name,
    inheritAttrs: true,
    props: {
      text: { type: [String, Number], default: undefined },
      class: { type: String, default: undefined },
    },
    setup(props, { slots, attrs }) {
      return () =>
        h(
          opts.tag ?? 'div',
          {
            ...attrs,
            'data-slot': name,
            class: [cls, opts.extraClass, props.class],
          },
          slots.default?.() ?? (props.text != null ? [String(props.text)] : []),
        )
    },
  })
}

/** 传入 attrs（如 data-state）的变体 */
function primWithAttrs(name: string, cls: string, pickAttrs: (props: any) => Record<string, unknown>): Component {
  return defineComponent({
    name,
    inheritAttrs: true,
    props: {
      text: { type: [String, Number], default: undefined },
      class: { type: String, default: undefined },
    },
    setup(props, { slots, attrs }) {
      return () =>
        h(
          'tr',
          {
            ...attrs,
            ...pickAttrs(props),
            'data-slot': name,
            class: [cls, props.class],
          },
          slots.default?.(),
        )
    },
  })
}

// ---- 卡片族（契约：card / card-header / card-title / card-description / card-content / card-footer）----
export const CardHeader = prim('card-header', 'flex flex-col gap-1 px-5')
export const CardTitle = prim('card-title', 'font-semibold leading-tight')
export const CardDescription = prim('card-description', 'text-muted-foreground text-sm')
export const CardContent = prim('card-content', 'px-5')
export const CardFooter = prim('card-footer', 'flex items-center px-5')
// card 根元素只有 py-5，default 槽包一层 CardContent 补水平内边距（与 header/footer 对齐）
export const Card = defineComponent({
  name: 'card',
  props: { class: { type: String, default: undefined } },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-slot': 'card',
          class: ['bg-card text-card-foreground flex min-w-0 flex-col gap-4 border py-5', props.class],
        },
        [
          slots.header?.(),
          slots.default ? h(CardContent, null, { default: slots.default }) : null,
          slots.footer?.(),
        ],
      )
  },
})

// ---- 提示框原语（契约：alert-title / alert-description，供 page-view 装配）----
export const AlertTitle = prim('alert-title', 'font-medium text-sm')
export const AlertDescription = prim('alert-description', 'text-sm opacity-90')

// ---- 分隔线 / 骨架 / 标签 ----
export const Separator = prim('separator', 'bg-border', { tag: 'div' })
export const Skeleton = prim('skeleton', 'bg-muted animate-pulse')
export const Label = prim('label', 'text-sm font-medium leading-none', { tag: 'label' })

// ---- 表格原语（契约：table-header / table-body / table-row / table-head / table-cell / table-caption）----
export const TableHeader = prim('table-header', 'border-b [&_tr]:border-b', { tag: 'thead' })
export const TableBody = prim('table-body', '', { tag: 'tbody' })
export const TableHead = prim(
  'table-head',
  'h-9 px-2 text-left align-middle text-xs font-medium tracking-wide uppercase text-muted-foreground whitespace-nowrap',
  { tag: 'th' },
)
export const TableCell = prim('table-cell', 'px-2 py-1.5 align-middle whitespace-nowrap', { tag: 'td' })
export const TableCaption = prim('table-caption', 'text-muted-foreground mt-2 text-xs', { tag: 'caption' })
export const TableRow = primWithAttrs('table-row', 'border-b transition-colors hover:bg-muted/40', props => ({
  'data-state': props.selected ? 'selected' : undefined,
}))
// TableRow 需要 selected prop 声明
;(TableRow as any).props = {
  ...(TableRow as any).props,
  selected: { type: Boolean, default: false },
}
