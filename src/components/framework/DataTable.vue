<script setup lang="ts">
/**
 * data-table：TanStack Table 封装（shadcn-vue 表格样式）。
 *
 * 特性按需启用（不想自封装分组逻辑时直接开箱用）：
 *   - sortable   → getSortedRowModel
 *   - searchable → getFilteredRowModel（全局包含搜索）
 *   - groupBy    → getGroupedRowModel + getExpandedRowModel（分组聚合）
 *   - aggregations → 列级聚合函数（sum/count/avg/min/max）
 *   - paginated  → getPaginationRowModel
 *
 * 列来源：columns（渲染器从 column 配置节点拆出，支持 @@User 展开）
 *      或 fields（data="@@User" 时自动生成全部字段列）。
 * 单元格渲染类型感知（FieldValue）：布尔→是/否徽章，数组→徽章组，
 * 引用对象→名称，日期→格式化，数字→千分位。
 */

import { computed, h, ref, type Component } from 'vue'
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import type { ColumnDef, ExpandedState, SortingState } from '@tanstack/table-core'
import type { FieldMeta } from '@/framework/types'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-vue-next'
import FieldValue from './FieldValue.vue'
import EmptyView from './EmptyView.vue'

export interface ColumnConfig {
  field: string
  label?: string
  meta?: FieldMeta
  align?: 'left' | 'right' | 'center'
  width?: number
}

const props = withDefaults(
  defineProps<{
    title?: string
    rows?: any[]
    fields?: FieldMeta[]
    columns?: ColumnConfig[]
    searchable?: boolean
    sortable?: boolean
    paginated?: boolean
    pageSize?: number
    /** 分组字段（按需启用分组聚合特性） */
    groupBy?: string
    /** 列级聚合：{ 字段名: sum|count|avg|min|max } */
    aggregations?: Record<string, string>
    emptyText?: string
  }>(),
  // paginated 必须显式默认 true：Vue 会把缺席的 boolean prop 铸造为 false
  { rows: () => [], pageSize: 10, emptyText: '暂无数据', paginated: true },
)

const slots = defineSlots<{ toolbar?: () => any }>()

// ---------- 列定义 ----------
const effectiveCols = computed<ColumnConfig[]>(() => {
  if (props.columns?.length) return props.columns
  return (props.fields ?? []).map(f => ({ field: f.name, label: f.label, meta: f }))
})

const helper = createColumnHelper<Record<string, any>>()

const columnDefs = computed<ColumnDef<Record<string, any>, any>[]>(() =>
  effectiveCols.value.map(c => {
    const numeric = c.meta?.type === 'number' || c.align === 'right'
    const aggFn = props.aggregations?.[c.field]
    return helper.accessor(
      (row: any) => row?.[c.field],
      {
        id: c.field,
        header: c.label ?? c.field,
        cell: (info: any) => h(FieldValue, { meta: c.meta ?? null, value: info.getValue() }),
        aggregationFn: (aggFn as any) ?? undefined,
        aggregatedCell: (info: any) => {
          if (!aggFn) return h('span')
          const v = info.getValue()
          const text = aggFn === 'count' ? String(v) : formatNumber(v)
          return h('span', { class: 'font-medium tabular-nums' }, text)
        },
        meta: { align: numeric ? 'right' : (c.align ?? 'left'), width: c.width },
      },
    )
  }),
)

// ---------- 状态 ----------
const sorting = ref<SortingState>([])
const globalFilter = ref('')
const expanded = ref<ExpandedState>(true)

// state getter 必须返回稳定引用：每次访问都新建数组会让 TanStack 的
// memo 依赖永远不命中 → 行模型无限重算 → 无限更新循环
const groupingState = computed<string[]>(() => (props.groupBy ? [props.groupBy] : []))

const table = useVueTable({
  get data() {
    return props.rows ?? []
  },
  get columns() {
    return columnDefs.value
  },
  state: {
    get sorting() {
      return props.sortable === false ? [] : sorting.value
    },
    get globalFilter() {
      return props.searchable ? globalFilter.value : ''
    },
    get grouping() {
      return groupingState.value
    },
    get expanded() {
      return props.groupBy ? expanded.value : ({} as ExpandedState)
    },
  },
  onSortingChange: updater => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onGlobalFilterChange: updater => {
    globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater
  },
  onExpandedChange: updater => {
    expanded.value = typeof updater === 'function' ? (updater as any)(expanded.value) : updater
  },
  globalFilterFn: 'includesString',
  getCoreRowModel: getCoreRowModel(),
  ...(props.sortable !== false ? { getSortedRowModel: getSortedRowModel() } : {}),
  ...(props.searchable ? { getFilteredRowModel: getFilteredRowModel() } : {}),
  ...(props.groupBy ? { getGroupedRowModel: getGroupedRowModel(), getExpandedRowModel: getExpandedRowModel() } : {}),
  ...(props.paginated !== false ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  initialState: {
    pagination: { pageSize: props.pageSize ?? 10, pageIndex: 0 },
    // 分组默认展开（autoReset 会回落到 initialState，ref 初值不够）
    ...(props.groupBy ? { expanded: true as const } : {}),
  },
})

const rows = computed(() => table.getRowModel().rows)
const totalRows = computed(() => props.rows?.length ?? 0)
const filteredCount = computed(() => table.getPrePaginationRowModel().rows.length)

const alignCls = (align?: string) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

function headStyle(col: any) {
  const width = col.columnDef.meta?.width
  return width ? { width: `${width}px` } : undefined
}

// 分组头显示的聚合徽标（groupby 列右侧）
const groupAggs = computed(() =>
  Object.entries(props.aggregations ?? {}).filter(([field]) => field !== props.groupBy),
)

function fmtAgg(field: string, rows: any[]): string {
  const fn = props.aggregations?.[field]
  if (!fn) return ''
  const values = rows.map(r => Number(r?.[field])).filter(v => !Number.isNaN(v))
  let v = 0
  switch (fn) {
    case 'sum': v = values.reduce((a, b) => a + b, 0); break
    case 'avg': v = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break
    case 'max': v = values.length ? Math.max(...values) : 0; break
    case 'min': v = values.length ? Math.min(...values) : 0; break
    case 'count': return String(rows.length)
    default: return ''
  }
  return formatNumber(Math.round(v * 100) / 100)
}
</script>

<template>
  <div class="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm">
    <!-- 工具栏：标题 + 搜索 + actions（渲染器拆出的 toolbar 插槽） -->
    <div class="flex flex-wrap items-center gap-3 border-b px-4 py-3">
      <div v-if="props.title" class="text-sm font-semibold">
        {{ props.title }}
        <Badge variant="secondary" class="ml-1.5 tabular-nums">{{ props.searchable ? filteredCount : totalRows }}</Badge>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <slot name="toolbar" />
        <div v-if="props.searchable" class="relative">
          <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            :model-value="globalFilter"
            placeholder="搜索…"
            class="w-56 pl-8"
            @update:model-value="table.setGlobalFilter(String($event ?? ''))"
          />
        </div>
      </div>
    </div>

    <EmptyView v-if="!rows.length && !filteredCount" :description="props.emptyText" />

    <Table v-else>
      <TableHeader>
        <TableRow class="bg-muted/40 hover:bg-muted/40">
          <TableHead
            v-for="header in table.getFlatHeaders()"
            :key="header.id"
            :style="headStyle(header.column)"
            :class="alignCls(header.column.columnDef.meta?.align)"
          >
            <component
              :is="header.column.getCanSort() ? 'button' : 'span'"
              class="inline-flex items-center gap-1"
              :class="header.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : ''"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <FlexRender
                v-if="!header.column.getIsGrouped()"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <template v-else>{{ header.column.columnDef.header }}</template>
              <ChevronUp v-if="header.column.getIsSorted() === 'asc'" class="size-3.5" />
              <ChevronDown v-else-if="header.column.getIsSorted() === 'desc'" class="size-3.5" />
            </component>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow
          v-for="row in rows"
          :key="row.id"
          :data-state="row.getIsSelected() ? 'selected' : undefined"
          :class="cn(row.getIsGrouped() && 'bg-muted/30 hover:bg-muted/30')"
        >
          <TableCell
            v-for="cell in row.getVisibleCells()"
            :key="cell.id"
            :class="alignCls(cell.column.columnDef.meta?.align)"
          >
            <!-- 分组行首格：展开/收起 + 分组值 + 子行数 + 聚合徽标 -->
            <div v-if="cell.getIsGrouped()" class="flex flex-wrap items-center gap-2">
              <button class="inline-flex items-center gap-1.5 font-medium cursor-pointer" @click="row.toggleExpanded()">
                <ChevronRight v-if="!row.getIsExpanded()" class="text-muted-foreground size-4" />
                <ChevronDown v-else class="text-muted-foreground size-4" />
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </button>
              <Badge variant="outline" class="tabular-nums">{{ row.subRows.length }} 项</Badge>
              <Badge
                v-for="[aggField] in groupAggs"
                :key="aggField"
                variant="secondary"
                class="tabular-nums"
              >
                {{ aggField }} Σ {{ fmtAgg(aggField, row.subRows.map((sr: any) => sr.original)) }}
              </Badge>
            </div>

            <!-- 聚合格 -->
            <FlexRender
              v-else-if="cell.getIsAggregated()"
              :render="cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell"
              :props="cell.getContext()"
            />

            <!-- 分组时非分组列占位 -->
            <span v-else-if="cell.getIsPlaceholder()" />

            <FlexRender v-else :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- 分页 -->
    <div
      v-if="props.paginated !== false && table.getPageCount() > 1"
      class="flex items-center justify-between border-t px-4 py-2.5 text-sm"
    >
      <span class="text-muted-foreground text-xs tabular-nums">
        第 {{ table.getState().pagination.pageIndex + 1 }} / {{ table.getPageCount() }} 页
        · 共 {{ filteredCount }} 条
      </span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">
          <ChevronLeft /> 上一页
        </Button>
        <Button variant="outline" size="sm" :disabled="!table.getCanNextPage()" @click="table.nextPage()">
          下一页 <ChevronRight />
        </Button>
      </div>
    </div>
  </div>
</template>
