/**
 * deckurate 套件表格原语：Deckurate base/data-table 的表头视觉 —— 大写 + 字距加宽。
 * （table-head 覆盖经契约解析自动作用于 table 复合件；其余表格原语回落 shadcn。）
 */

import { defineComponent, h, type Component } from 'vue'

function prim(name: string, cls: string): Component {
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
          'th',
          {
            ...attrs,
            'data-slot': name,
            class: [cls, props.class],
          },
          slots.default?.() ?? (props.text != null ? [String(props.text)] : []),
        )
    },
  })
}

export const DeckTableHead = prim(
  'table-head',
  'text-muted-foreground h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider',
)
