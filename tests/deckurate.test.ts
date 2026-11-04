/**
 * deckurate 套件 + deckurate 系统回归：
 * 1) 套件解析（deckurate 覆盖 + 共享扩展契约回落）；2) 系统按声明启动（kit=deckurate / theme=deckurate）；
 * 3) 界面结构（树 / 工具栏 / kbd / tag-list / toggle-group / service-status / progress-ring / 图表 / 表格）。
 */
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '..')

beforeAll(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    const file = path.startsWith('/systems/') ? join(ROOT, path.slice(1)) : join(ROOT, 'public', path)
    if (!existsSync(file)) {
      return { ok: false, status: 404, text: async () => '', json: async () => { throw new Error('404 ' + path) } }
    }
    const text = readFileSync(file, 'utf-8')
    return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
  })
})

import App from '@/App.vue'
import { appState, loadSystem } from '@/framework/app-store'
import { kitState, setKit } from '@/framework/kit-store'
import { resolveComponent, KIT_LIST } from '@/registry'

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

describe('deckurate 套件与系统', () => {
  it('KIT_LIST 含三个套件；deckurate 覆盖 button，共享扩展契约经兜底可用', () => {
    expect(KIT_LIST.map(k => k.id)).toEqual(['shadcn', 'plain', 'deckurate'])

    const shadcnButton = resolveComponent('button')
    setKit('deckurate')
    expect(resolveComponent('button')).not.toBe(shadcnButton) // deckurate 覆盖生效
    // 共享扩展契约（Deckurate 基础组件引入）经 shadcn 兜底全部可解析
    for (const name of ['toolbar', 'kbd', 'tag-list', 'toggle-group', 'tree', 'progress-ring', 'service-status']) {
      expect(resolveComponent(name), name).toBeTruthy()
    }
    setKit('shadcn')
    expect(resolveComponent('button')).toBe(shadcnButton)
  })

  it('deckurate 系统按声明启动：kit=deckurate / theme=deckurate，仪表盘结构完整', async () => {
    const wrapper = await mountApp() // 先挂载触发 boot（装载 systems/index.json），默认进入 back
    await loadSystem('deckurate'); await settle(120)
    expect(appState.system).toBe('deckurate')
    expect(kitState.kit).toBe('deckurate')
    expect(kitState.theme).toBe('deckurate')
    expect(document.documentElement.dataset.theme).toBe('deckurate')

    // 侧栏：5 个菜单项 + 文件夹树（folders.json 数据驱动）
    const navText = wrapper.find('aside nav').text()
    for (const label of ['仪表盘', '文库', '标签管理', '版本历史', '回收站']) {
      expect(navText, label).toContain(label)
    }
    expect(wrapper.find('[data-slot="tree"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="tree"]').text()).toContain('市场推广')

    // 仪表盘：4 stat-card + 图表 SVG + service-status + progress-ring
    expect(wrapper.findAll('[data-slot="stat-card"]').length).toBe(4)
    expect(wrapper.findAll('svg path').length).toBeGreaterThan(2)
    expect(wrapper.find('[data-slot="service-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="progress-ring"]').exists()).toBe(true)

    // 仪表盘表格：@@Document 引用渲染最近文档
    expect(wrapper.text()).toContain('Q4 产品发布会')
    wrapper.unmount()
  }, 30000)

  it('文库页：toolbar / kbd / tag-list / toggle-group / 大写表头齐全', async () => {
    const wrapper = await mountApp()
    await loadSystem('deckurate'); await settle(120)
    // 导航到文库
    const nav = wrapper.findAll('aside nav button')
    const libBtn = nav.find(b => b.text().includes('文库'))
    expect(libBtn, `文库按钮未找到，实际菜单：${nav.map(b => b.text()).join('/')}`).toBeTruthy()
    await libBtn!.trigger('click'); await settle()

    expect(wrapper.find('[data-slot="toolbar"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="kbd"]').text()).toContain('⌘K')
    const tagList = wrapper.find('[data-slot="tag-list"]')
    expect(tagList.exists()).toBe(true)
    expect(tagList.text()).toContain('新品发布')
    expect(tagList.text()).toMatch(/\+\d/) // 溢出 +N
    expect(wrapper.find('[data-slot="toggle-group"]').exists()).toBe(true)
    // deckurate 表头：大写 + 字距加宽
    const head = wrapper.find('th[data-slot="table-head"]')
    expect(head.exists()).toBe(true)
    expect(head.classes().join(' ')).toContain('uppercase')
    wrapper.unmount()
  }, 30000)
})
