/**
 * deckurate 套件 tabs 族：底线式标签页（Deckurate base/tab）。
 * 激活 = border-primary text-primary；provide/inject 同 plain 套件模式。
 */

import { defineComponent, h, inject, provide, ref, type Component, type VNode } from 'vue'

interface TabsCtx {
  readonly active: string
  setActive(v: string): void
}

const TABS_KEY = Symbol('pp-deckurate-tabs')

export const Tabs: Component = defineComponent({
  name: 'DeckTabs',
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
  name: 'DeckTabsList',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { 'data-slot': 'tabs-list', class: 'border-border flex w-fit items-center gap-1 border-b' },
        slots.default?.(),
      )
  },
})

export const TabsTrigger: Component = defineComponent({
  name: 'DeckTabsTrigger',
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
            '-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            active
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
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
  name: 'DeckTabsContent',
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
