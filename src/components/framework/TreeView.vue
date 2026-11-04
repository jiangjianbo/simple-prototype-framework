<script setup lang="ts">
/**
 * tree（契约组件，套件无关）：树形导航（文件夹树等）。Deckurate base/tree 简化版。
 * items: [{ id, label, count?, children? }]；点击选中（本地态），无连接线、16px 缩进、rotate 箭头。
 */
import { computed, ref } from 'vue'

export interface TreeItem {
  id: string
  label: string
  count?: number
  children?: TreeItem[]
}

const props = withDefaults(
  defineProps<{ items?: TreeItem[]; /** data 为渲染器注入的数据引用结果（items 别名） */ data?: TreeItem[]; defaultExpanded?: boolean }>(),
  { items: () => [], data: undefined, defaultExpanded: true },
)
const treeItems = computed(() => props.data ?? props.items)
const emit = defineEmits<{ select: [id: string] }>()

const selected = ref<string>('')
const expanded = ref<Set<string>>(new Set())

const isExpanded = (item: TreeItem) =>
  props.defaultExpanded ? !expanded.value.has(item.id) : expanded.value.has(item.id)

const toggle = (item: TreeItem, event: Event) => {
  event.stopPropagation()
  const next = new Set(expanded.value)
  if (props.defaultExpanded ? next.has(item.id) : !next.has(item.id)) next.delete(item.id)
  else next.add(item.id)
  expanded.value = next
}

const select = (item: TreeItem) => {
  selected.value = item.id
  emit('select', item.id)
}
</script>

<script lang="ts">
/** 递归子树（defineComponent 放独立 script 以便自引用） */
import { defineComponent, h, type Component, type PropType, type VNodeChild } from 'vue'
import type { TreeItem as TreeItemT } from './TreeView.vue'

const TreeNode: Component = defineComponent({
  name: 'TreeNode',
  props: {
    item: { type: Object as PropType<TreeItemT>, required: true },
    depth: { type: Number, default: 0 },
    selectedId: { type: String, default: '' },
    isExpanded: { type: Function as PropType<(i: TreeItemT) => boolean>, required: true },
    onToggle: { type: Function as PropType<(i: TreeItemT, e: Event) => void>, required: true },
    onSelect: { type: Function as PropType<(i: TreeItemT) => void>, required: true },
  },
  setup(p) {
    const render = (): VNodeChild => {
      const hasChildren = (p.item.children?.length ?? 0) > 0
      const active = p.selectedId === p.item.id
      return h(
        'div',
        { role: 'treeitem', 'aria-selected': active, 'data-tree-node': p.item.id },
        [
          h(
            'div',
            {
              class: [
                'hover:bg-muted flex cursor-pointer items-center gap-1 rounded-md py-1 pr-2 text-sm transition-colors',
                active ? 'bg-primary/15 text-primary font-medium' : 'text-foreground',
              ],
              style: { paddingLeft: `${p.depth * 16 + 4}px` },
              onClick: () => p.onSelect(p.item),
            },
            [
              hasChildren
                ? h(
                    'span',
                    {
                      class:
                        'text-muted-foreground hover:bg-muted inline-flex size-5 shrink-0 items-center justify-center rounded transition-transform',
                      style: { transform: p.isExpanded(p.item) ? 'rotate(90deg)' : 'none' },
                      onClick: (e: Event) => p.onToggle(p.item, e),
                    },
                    '▸',
                  )
                : h('span', { class: 'inline-block size-5 shrink-0' }),
              h('span', { class: 'truncate' }, p.item.label),
              p.item.count != null
                ? h(
                    'span',
                    { class: 'text-muted-foreground ml-auto text-xs tabular-nums' },
                    String(p.item.count),
                  )
                : null,
            ],
          ),
          hasChildren && p.isExpanded(p.item)
            ? h(
                'div',
                { role: 'group' },
                (p.item.children ?? []).map(c =>
                  h(TreeNode, {
                    item: c,
                    depth: p.depth + 1,
                    selectedId: p.selectedId,
                    isExpanded: p.isExpanded,
                    onToggle: p.onToggle,
                    onSelect: p.onSelect,
                  }),
                ),
              )
            : null,
        ],
      )
    }
    return render
  },
})
</script>

<template>
  <div data-slot="tree" role="tree" class="flex flex-col gap-0.5">
    <TreeNode
      v-for="item in treeItems"
      :key="item.id"
      :item="item"
      :depth="0"
      :selected-id="selected"
      :is-expanded="isExpanded"
      :on-toggle="toggle"
      :on-select="select"
    />
  </div>
</template>
