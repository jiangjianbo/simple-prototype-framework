/**
 * 套件（Kit）与主题（Theme）状态（§15）。
 *
 * - 套件 = 组件契约的一套实现（registry 按当前套件解析，见 src/registry.ts）
 * - 主题 = CSS 变量配色方案（src/style.css 的 [data-theme] 块），与套件正交、自由组合
 *
 * 两者都由 systems/index.json 按系统声明（kit / theme 字段），顶栏可在运行时临时切换：
 * 切套件触发整树重渲染（App.vue 以 kit 为 key），切主题只改根元素属性即时生效。
 */

import { reactive } from 'vue'

export interface KitMeta {
  id: string
  label: string
  description: string
}

export interface ThemeMeta {
  id: string
  label: string
}

/** 内置主题清单（新增主题 = style.css 加一个 [data-theme] 变量块 + 在此登记） */
export const THEMES: ThemeMeta[] = [
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
  { id: 'warm', label: '暖沙' },
  { id: 'deckurate', label: '靛蓝 Deckurate' },
]

export const DEFAULT_KIT = 'shadcn'
export const DEFAULT_THEME = 'light'

export const kitState = reactive({
  kit: DEFAULT_KIT,
  theme: DEFAULT_THEME,
})

export function setKit(kit: string) {
  kitState.kit = kit
}

/** 应用主题到根元素：dark 主题走 .dark class（供 Tailwind dark: 变体），其余写 data-theme */
export function applyTheme(theme: string) {
  kitState.theme = theme
  syncThemeDom()
}

export function syncThemeDom() {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.classList.toggle('dark', kitState.theme === 'dark')
  el.dataset.theme = kitState.theme
}
