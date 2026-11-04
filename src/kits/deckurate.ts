/**
 * deckurate 套件（§15）：复刻 Deckurate-Front 基础组件视觉语言 ——
 * 胶囊徽标、下划线标签页、大写表头、语义色统计卡、顶栏三段式布局、indigo 主色（配 deckurate 主题）。
 *
 * 部分覆盖（套件特性）：仅覆盖视觉语言与 shadcn 有实质差异的契约名，
 * 其余（表单控件、卡片、图表、表格骨架等）回落默认套件 shadcn。
 * 共享新增契约（toolbar/kbd/tag-list/toggle-group/tree/progress-ring/service-status）
 * 已注册在 shadcn 套件，本套件经兜底自动获得。
 */

import type { Component } from 'vue'

import DeckButton from '@/components/deckurate/Button.vue'
import DeckBadge from '@/components/deckurate/Badge.vue'
import DeckStatCard from '@/components/deckurate/StatCard.vue'
import DeckAppLayout from '@/components/deckurate/AppLayout.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/deckurate/tabs'
import { DeckTableHead } from '@/components/deckurate/primitives'

export const DECKURATE_KIT: Record<string, Component> = {
  button: DeckButton,
  badge: DeckBadge,
  'stat-card': DeckStatCard,
  'app-layout': DeckAppLayout,
  'tabs-root': Tabs,
  'tabs-list': TabsList,
  'tabs-trigger': TabsTrigger,
  'tabs-content': TabsContent,
  'table-head': DeckTableHead,
}
