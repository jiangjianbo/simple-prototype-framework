/**
 * deckurate 原型新形态回归：侧栏导航计数与上下分区、文库双视图切换
 * （data-views：列表 ↔ 画廊）、行点击进文档查看器（doc-viewer：缩略图轨 +
 * 主视图 + 可折叠工具区）、标签管理左右布局（select-list + card-grid）。
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

const settle = async (ms = 30) => {
  await new Promise(r => setTimeout(r, ms))
  const { nextTick } = await import('vue')
  for (let i = 0; i < 6; i++) await nextTick()
}

const mountApp = async () => {
  const wrapper = mount(App)
  await settle(80)
  expect(appState.status).toBe('ready')
  await loadSystem('deckurate'); await settle(120)
  return wrapper
}

const goto = async (wrapper: any, label: string) => {
  const btn = wrapper.findAll('aside nav button').find((b: any) => b.text().includes(label))
  if (!btn) throw new Error('菜单不存在: ' + label)
  await btn.trigger('click'); await settle()
}

const h1 = (wrapper: any) => wrapper.find('main h1').text().trim()

describe('deckurate 原型新形态', () => {
  it('侧栏：菜单项带靠右计数，menu 槽分区（nav-menu · separator · tree）', async () => {
    const wrapper = await mountApp()

    const nav = wrapper.find('aside nav')
    const libBtn = nav.findAll('button').find((b: any) => b.text().includes('文库'))
    expect(libBtn!.text()).toContain('128') // 文库计数
    expect(nav.findAll('button').find((b: any) => b.text().includes('回收站'))!.text()).toContain('5')

    // menu 槽上下分区：nav-menu 与 tree 之间有 separator
    const aside = wrapper.find('aside')
    expect(aside.find('[data-slot="separator"]').exists()).toBe(true)
    expect(aside.find('[data-slot="tree"]').exists()).toBe(true)
    wrapper.unmount()
  }, 30000)

  it('文库：工具栏内分隔线必须竖向（横向分隔线 w-full 会挤爆 flex 行布局）', async () => {
    const wrapper = await mountApp()
    await goto(wrapper, '文库')

    const toolbar = wrapper.find('[data-slot="toolbar"]')
    expect(toolbar.exists()).toBe(true)
    expect(toolbar.text()).toContain('新建')
    expect(toolbar.text()).toContain('上传')

    const sep = toolbar.find('[data-slot="separator"]')
    expect(sep.exists()).toBe(true)
    // 横向分隔线带 data-[orientation=horizontal]:w-full，在 w-fit flex 行里
    // 会占满整行并把后续子项（搜索框/标签列表）挤成窄条，标签换行竖堆撑高工具栏
    expect(sep.attributes('data-orientation')).toBe('vertical')
    wrapper.unmount()
  }, 30000)

  it('文库：data-views 默认列表视图，切画廊出现卡片网格（10 张带封面）', async () => {
    const wrapper = await mountApp()
    await goto(wrapper, '文库')
    expect(h1(wrapper)).toBe('文库')

    // 默认 list 视图：表格可见、画廊缺席
    expect(wrapper.find('tbody tr').exists()).toBe(true)
    expect(wrapper.find('[data-slot="card-grid"]').exists()).toBe(false)

    // 切到画廊
    const galleryBtn = wrapper.findAll('[data-slot="data-views-toggle"] button')
      .find((b: any) => b.text() === '画廊')
    expect(galleryBtn, '画廊切换按钮不存在').toBeTruthy()
    await galleryBtn!.trigger('click'); await settle()

    const grid = wrapper.find('[data-slot="card-grid"]')
    expect(grid.exists()).toBe(true)
    expect(wrapper.findAll('[data-slot="card-grid-item"]').length).toBe(10)
    const img = grid.find('img')
    expect(img.attributes('src')).toContain('cover-slider.svg')
    wrapper.unmount()
  }, 30000)

  it('行点击进文档查看器：缩略图轨 5 页 + 工具区可折叠', async () => {
    const wrapper = await mountApp()
    await goto(wrapper, '文库')
    await wrapper.find('tbody tr').trigger('click'); await settle(60)

    expect(h1(wrapper)).toBe('文档查看')
    const viewer = wrapper.find('[data-slot="doc-viewer"]')
    expect(viewer.exists()).toBe(true)
    // 缩略图导轨 5 项，主视图显示第 1 页
    expect(wrapper.findAll('[data-thumb-index]').length).toBe(5)
    expect(viewer.find('[data-slot="doc-viewer-page"]').attributes('src')).toContain('slide-1.svg')

    // 缩略图点选切换 → 主视图跟随
    await wrapper.find('[data-thumb-index="2"]').trigger('click'); await settle()
    expect(viewer.text()).toContain('增长复盘')

    // 工具区折叠：内容消失
    expect(viewer.text()).toContain('下载原文')
    await wrapper.find('[data-slot="doc-viewer-tools-toggle"]').trigger('click'); await settle()
    expect(wrapper.text()).not.toContain('下载原文')
    wrapper.unmount()
  }, 30000)

  it('标签管理：左侧 select-list 分类 + 右侧 card-grid 标签卡（12 张）', async () => {
    const wrapper = await mountApp()
    await goto(wrapper, '标签管理')
    expect(h1(wrapper)).toBe('标签管理')

    const list = wrapper.find('[data-slot="select-list"]')
    expect(list.exists()).toBe(true)
    expect(list.text()).toContain('全部标签')
    expect(list.text()).toContain('12')

    expect(wrapper.findAll('[data-slot="card-grid-item"]').length).toBe(12)
    expect(wrapper.find('[data-slot="card-grid"]').text()).toContain('新品发布')

    // 纯文本数据（无任何行带封面）→ 不渲染媒体占位块（文件图标图形）
    expect(wrapper.find('[data-slot="card-grid"] [data-slot="card-grid-media"]').exists()).toBe(false)
    expect(wrapper.find('[data-slot="card-grid"] svg').exists()).toBe(false)
    // 徽标（使用次数）不随媒体区一起消失，转内联展示
    expect(wrapper.find('[data-slot="card-grid"]').text()).toContain('23')
    wrapper.unmount()
  }, 30000)
})
