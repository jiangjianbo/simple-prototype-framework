/**
 * plain 套件 tabs 族：provide/inject 实现的极简下划线标签页。
 * 契约同 shadcn 版：Tabs(defaultValue) + TabsList + TabsTrigger(value) + TabsContent(value)。
 */

import { defineComponent, h, inject, provide, ref, type Component, type VNode } from 'vue'

interface TabsCtx {
  readonly active: string
  setActive(v: string): void
}

const TABS_KEY = Symbol('pp-plain-tabs')

export const Tabs: Component = defineComponent({
  name: 'PlainTabs',
  props: {
    modelValue: { type: String, default: undefined },
    defaultValue: { type: String, default: undefined },
    class: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    const internal = ref(props.defaultValue ?? props.modelValue ?? '')
    provide(TABS_KEY, {
      get active() {
        return props.modelValue ?? internal.value
      },
      setActive(v: string) {
        internal.value = v
      },
    })
    return () => h('div', { 'data-slot': 'tabs', class: props.class }, slots.default?.())
  },
})

export const TabsList: Component = defineComponent({
  name: 'PlainTabsList',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { 'data-slot': 'tabs-list', class: 'flex w-fit items-center gap-4 border-b' },
        slots.default?.(),
      )
  },
})

export const TabsTrigger: Component = defineComponent({
  name: 'PlainTabsTrigger',
  props: {
    value: { type: String, required: true },
    class: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const ctx = inject<TabsCtx>(TABS_KEY)
    return () => {
      const active = ctx?.active === props.value
      return h(
        'button',
        {
          'data-slot': 'tabs-trigger',
          type: 'button',
          class: [
            '-mb-px cursor-pointer border-b-2 px-1 py-1.5 text-sm transition-colors',
            active
              ? 'border-primary text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground border-transparent',
            props.class,
          ],
          onClick: () => ctx?.setActive(props.value),
        },
        slots.default?.(),
      )
    }
  },
})

export const TabsContent: Component = defineComponent({
  name: 'PlainTabsContent',
  props: {
    value: { type: String, required: true },
    class: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const ctx = inject<TabsCtx>(TABS_KEY)
    return () =>
      h(
        'div',
        {
          'data-slot': 'tabs-content',
          class: props.class,
          style: { display: ctx?.active === props.value ? '' : 'none' },
        },
        slots.default?.() as VNode[],
      )
  },
})
