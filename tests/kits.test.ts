/**
 * 套件（Kit）与主题（Theme）回归：按系统声明应用、运行时切换、旧名别名兼容。
 */
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '..')

beforeAll(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    const file = path.startsWith('/systems/')
      ? join(ROOT, path.slice(1))
      : join(ROOT, 'public', path)
    if (!existsSync(file)) {
      return { ok: false, status: 404, text: async () => '', json: async () => { throw new Error('404 ' + path) } }
    }
    const text = readFileSync(file, 'utf-8')
    return {
      ok: true, status: 200,
      text: async () => text,
      json: async () => JSON.parse(text),
    }
  })
})

import App from '@/App.vue'
import { appState, loadSystem } from '@/framework/app-store'
import { kitState, applyTheme, setKit, syncThemeDom, DEFAULT_KIT, DEFAULT_THEME } from '@/framework/kit-store'
import { resolveComponent, KIT_LIST, COMPONENT_ALIASES } from '@/registry'

const settle = async (ms = 30) => {
  await new Promise(r => setTimeout(r, ms))
  const { nextTick } = await import('vue')
  for (let i = 0; i < 6; i++) await nextTick()
}

const mountApp = async () => {
  const wrapper = mount(App)
  await settle(80)
  expect(appState.status).toBe('ready')
  return wrapper
}

describe('套件与主题', () => {
  it('KIT_LIST 注册三个套件；缺省套件/主题为 shadcn/light', () => {
    expect(KIT_LIST.map(k => k.id)).toEqual(['shadcn', 'plain', 'deckurate'])
    expect(DEFAULT_KIT).toBe('shadcn')
    expect(DEFAULT_THEME).toBe('light')
  })

  it('旧契约名经别名解析到与新名相同的实现', () => {
    const pairs: [string, string][] = [
      ['frame-with-title-and-menu-footer', 'app-layout'],
      ['app-shell', 'app-layout'],
      ['page-default', 'page-view'],
      ['menu-tree', 'nav-menu'],
      ['breadcrumb-auto', 'breadcrumb'],
      ['field-placeholder', 'field-list'],
      ['readonly-boolean', 'boolean-badge'],
      ['fallback-display', 'missing-component'],
      ['tag', 'badge'],
      ['divider', 'separator'],
      ['form', 'schema-form'],
    ]
    expect(Object.keys(COMPONENT_ALIASES)).toHaveLength(pairs.length)
    for (const [oldName, newName] of pairs) {
      expect(resolveComponent(oldName), oldName).toBe(resolveComponent(newName))
      expect(resolveComponent(oldName)).toBeTruthy()
    }
  })

  it('主题应用：dark 走 .dark class，其余写 data-theme；未登记主题回落 light', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')

    applyTheme('warm')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('warm')

    applyTheme('not-a-theme')
    expect(document.documentElement.dataset.theme).toBe('not-a-theme') // DOM 照写；无匹配变量块 = 浅色兜底
    applyTheme(DEFAULT_THEME)
    syncThemeDom()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('按系统声明应用套件/主题：userfront=plain/warm，back=shadcn/light', async () => {
    const wrapper = await mountApp() // boot 默认 back
    expect(appState.system).toBe('back')
    expect(kitState.kit).toBe('shadcn')
    expect(kitState.theme).toBe('light')
    // shadcn 套件：4 个 reka 触发器（button）
    expect(wrapper.findAll('header [data-slot="select-trigger"]').length).toBe(4)

    await loadSystem('userfront'); await settle(80)
    expect(kitState.kit).toBe('plain')
    expect(kitState.theme).toBe('warm')
    expect(document.documentElement.dataset.theme).toBe('warm')
    // plain 套件：select 变为原生 <select>；壳层换 plain AppLayout（无 bg-sidebar）
    const selects = wrapper.findAll('header select')
    expect(selects.length).toBe(4)
    expect(wrapper.find('aside nav').exists()).toBe(true)
    expect(wrapper.find('aside.bg-sidebar').exists()).toBe(false)
  }, 30000)

  it('card 默认槽包 card-content 补水平内边距（安全公告贴边回归，双套件同构）', async () => {
    const wrapper = await mountApp() // back / shadcn
    const card = wrapper.find('aside [data-slot="card"]')
    expect(card.exists()).toBe(true)
    const content = card.find('[data-slot="card-content"]')
    expect(content.exists()).toBe(true)
    expect(content.text()).toContain('季度攻防演练')

    // plain 套件的 card 同样包一层 card-content
    setKit('plain'); await settle()
    const plainContent = wrapper.find('aside [data-slot="card"] [data-slot="card-content"]')
    expect(plainContent.exists()).toBe(true)
    expect(plainContent.text()).toContain('季度攻防演练')

    // 还原套件，避免污染后续用例（同系统 boot 不重置声明值）
    setKit('shadcn'); await settle()
    wrapper.unmount()
  }, 30000)

  it('运行时切套件：setKit 后整树按新实现重挂载，回 shadcn 恢复；切系统重置为声明值', async () => {
    const wrapper = await mountApp()
    expect(wrapper.find('aside.bg-sidebar').exists()).toBe(true)

    // 切套件只改 store：App 以 系统:套件 为 key 自动整树重挂载，无需 loadSystem
    setKit('plain'); await settle()
    expect(kitState.kit).toBe('plain')
    expect(wrapper.findAll('header select').length).toBe(4) // plain 原生下拉
    expect(wrapper.find('aside.bg-sidebar').exists()).toBe(false)

    setKit('shadcn'); await settle()
    expect(wrapper.findAll('header [data-slot="select-trigger"]').length).toBe(4)
    expect(wrapper.find('aside.bg-sidebar').exists()).toBe(true)

    // 切系统 → 回到该系统声明的套件/主题
    await loadSystem('userfront'); await settle(80)
    expect(kitState.kit).toBe('plain')
    expect(kitState.theme).toBe('warm')
    wrapper.unmount()
  }, 30000)
})
