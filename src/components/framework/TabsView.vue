<script setup lang="ts">
/**
 * tabs（内部消化 children 的复合组件）：
 * children 须为 tab-pane 节点（props: label / value），
 * pane 的 children 渲染进对应 TabsContent。
 */

import { computed, defineComponent, h, type PropType, type VNode } from 'vue'
import type { Node } from '@/framework/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { NodeRenderer, useRenderCtx } from '@/framework/renderer'

const props = defineProps<{
  __nodes?: Node[]
  defaultValue?: string
}>()

const ctx = useRenderCtx()

const panes = computed(() => (props.__nodes ?? []).filter(n => n.component === 'tab-pane'))

function valueOf(p: Node, i: number): string {
  return String(p.value ?? p.label ?? `tab-${i}`)
}

const initial = computed(() => (panes.value.length ? valueOf(panes.value[0], 0) : ''))

const PaneBody = defineComponent({
  props: { pane: { type: Object as PropType<Node>, required: true } },
  setup(p) {
    return () => (p.pane.children ?? []).map(c => h(NodeRenderer, { node: c, ctx })) as VNode[]
  },
})
</script>

<template>
  <Tabs :default-value="props.defaultValue ?? initial" class="w-full">
    <TabsList v-if="panes.length > 1 || panes[0]?.label">
      <TabsTrigger v-for="(p, i) in panes" :key="i" :value="valueOf(p, i)">
        {{ p.label ?? p.value ?? `标签${i + 1}` }}
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="(p, i) in panes" :key="`c-${i}`" :value="valueOf(p, i)" class="pt-3">
      <PaneBody :pane="p" />
    </TabsContent>
  </Tabs>
</template>
