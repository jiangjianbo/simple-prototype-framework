/**
 * 标注功能回归（§14）：
 * - 探测属性：data-pp-path 全节点注入（见 pages-split.test.ts，此处不重复）
 * - 设计说明面板：hover 显示说明、关闭后顶栏按钮重开、拖动改位置
 * - 标注流程：hover 元素 → 图标 → 对话框（定位信息 + 输入）→ 保存 → 计数徽标
 * - 编辑模式：同路径再次打开回填并可删除
 * - 全部标注：列表、定位（切页跳转 + 高亮类）、清空
 * - 持久化：localStorage 写入 + loadPersisted 恢复
 * - 导出：buildAnnotationsMarkdown 纯函数格式
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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
    return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
  })
})

import App from '@/App.vue'
import { appState, loadSystem } from '@/framework/app-store'
import {
  annotationState,
  clearAnnotations,
  closeAnnotationDialog,
  setHoveredNote,
  toggleNotePanel,
  loadPersisted,
  buildAnnotationsMarkdown,
  type Annotation,
} from '@/framework/annotation-store'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

const fire = (el: Element, type: string, init: MouseEventInit = {}) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }))

const mountApp = async () => {
  // attachTo：标注层靠 document 级事件委托 + document.querySelector，应用必须挂进文档
  const wrapper = mount(App, { attachTo: document.body })
  await settle(80)
  expect(appState.status).toBe('ready')
  await loadSystem('userfront'); await settle(80)   // userfront 带 note 示例
  return wrapper
}

const q = (sel: string) => document.querySelector(sel)
const click = async (sel: string) => {
  const el = q(sel)
  if (!el) throw new Error(`元素不存在: ${sel}`)
  fire(el, 'click')
  await settle()
}

/** 在 roots 内按文字找按钮，找不到时报出候选，便于定位 */
const findBtn = (roots: (Element | null | undefined)[], label: string) => {
  for (const root of roots) {
    const btn = [...root?.querySelectorAll('button') ?? []]
      .find(b => b.textContent?.trim() === label || b.textContent?.includes(label))
    if (btn) return btn
  }
  const seen = roots.map(r => [...r?.querySelectorAll('button') ?? []].map(b => b.textContent?.trim()).join('|'))
  throw new Error(`按钮不存在: ${label}；现有: ${seen.join(' /// ')}`)
}

beforeEach(() => {
  localStorage.clear()
  clearAnnotations()
  closeAnnotationDialog()
  annotationState.listOpen = false
  setHoveredNote(null)
  toggleNotePanel(true)
})

afterEach(() => {
  document.getElementById('pp-bootstrap')?.remove()
})

describe('设计说明面板（note 字段）', () => {
  it('悬浮带 note 的元素：面板显示说明文字与元素名', async () => {
    const wrapper = await mountApp()
    const noted = q('[data-pp-note]')!
    fire(noted, 'mouseover'); await settle()

    expect(q('[data-slot="note-panel"]')).toBeTruthy()
    expect(q('[data-slot="note-panel-body"]')?.textContent).toContain('工作台是登录后的首屏')
    wrapper.unmount()
  }, 30000)

  it('悬浮到普通元素：面板回退占位提示；关闭后顶栏「设计说明」按钮可重开', async () => {
    const wrapper = await mountApp()
    // 普通元素（无 note，也无 note 祖先）：main 内找不带 data-pp-note 的探测元素
    const plain = [...document.querySelectorAll('main [data-pp-path]')]
      .find(el => !el.closest('[data-pp-note]'))!
    fire(plain, 'mouseover'); await settle()
    expect(q('[data-slot="note-panel-body"]')?.textContent).toContain('将鼠标悬浮到带设计说明的界面元素')

    await click('[data-slot="note-panel-close"]')
    expect(q('[data-slot="note-panel"]')).toBeNull()

    await click('[data-slot="note-panel-toggle"]')
    expect(q('[data-slot="note-panel"]')).toBeTruthy()
    wrapper.unmount()
  }, 30000)

  it('拖动标题栏：面板位置更新且被钳制在视口内', async () => {
    const wrapper = await mountApp()
    const panel = q('[data-slot="note-panel"]') as HTMLElement
    // onMounted 初始定位：jsdom innerWidth=1024 → left = 1024-320-24 = 680px
    expect(panel.style.left).toBe('680px')

    const header = q('[data-slot="note-panel-header"]')!
    fire(header, 'mousedown', { clientX: 200, clientY: 200 })
    fire(document.body, 'mousemove', { clientX: 400, clientY: 300 })
    fire(document.body, 'mouseup')
    await settle()

    const moved = q('[data-slot="note-panel"]') as HTMLElement
    // 拖到 400,300 → 计算 x=880 被钳制到 1024-320=704；y 不变（offsetY=100 → 300-100=... 见实现）
    expect(moved.style.left).toBe('704px')
    expect(Number(parseFloat(moved.style.top))).toBeGreaterThanOrEqual(0)
    // 拖动结束后 hover 更新恢复（dragging 标记复位）
    expect(annotationState.notePanel.dragging).toBe(false)
    wrapper.unmount()
  }, 30000)
})

describe('标注流程', () => {
  it('hover 元素出现图标 → 点击打开对话框（含定位信息）→ 输入保存 → 计数徽标', async () => {
    const wrapper = await mountApp()
    const target = [...document.querySelectorAll('main [data-pp-path]')]
      .find(el => (el.getAttribute('data-pp-path') ?? '').includes('工作台(home)'))!
    fire(target, 'mouseover'); await settle()

    // 图标可见（v-show 通过 display 控制）
    const icon = q('[data-slot="pp-annotate-btn"]') as HTMLElement
    expect(icon).toBeTruthy()
    expect(icon.style.display).not.toBe('none')

    fire(icon, 'click'); await settle()
    const dialog = q('[data-slot="annotation-dialog"]')
    expect(dialog).toBeTruthy()
    // 定位信息展示页面路径
    expect(dialog?.textContent).toContain('工作台(home)')

    const input = q('[data-slot="annotation-input"]') as HTMLTextAreaElement
    input.value = '这个指标卡的数值口径需要确认'
    fire(input, 'input'); await settle()
    await click('[data-slot="annotation-save"]')

    expect(annotationState.items.length).toBe(1)
    expect(annotationState.items[0].text).toBe('这个指标卡的数值口径需要确认')
    expect(annotationState.items[0].system).toBe('userfront')
    expect(annotationState.items[0].pageId).toBe('home')
    expect(q('[data-slot="annotation-dialog"]')).toBeNull()       // 保存后关闭
    expect(q('[data-slot="annotations-count"]')?.textContent?.trim()).toBe('1')

    // 持久化写入
    const stored = JSON.parse(localStorage.getItem('pp.annotations.v1')!)
    expect(stored.items[0].path).toBe(annotationState.items[0].path)
    wrapper.unmount()
  }, 30000)

  it('同路径再次打开为编辑模式：回填文字、可删除', async () => {
    const wrapper = await mountApp()
    const target = [...document.querySelectorAll('main [data-pp-path]')]
      .find(el => (el.getAttribute('data-pp-path') ?? '').includes('工作台(home)'))!
    fire(target, 'mouseover'); await settle()
    fire(q('[data-slot="pp-annotate-btn"]')!, 'click'); await settle()
    const input = q('[data-slot="annotation-input"]') as HTMLTextAreaElement
    input.value = '第一版标注'
    fire(input, 'input'); await settle()
    await click('[data-slot="annotation-save"]')

    // 再开同一路径 → 回填 + 删除按钮出现
    fire(target, 'mouseover'); await settle()
    fire(q('[data-slot="pp-annotate-btn"]')!, 'click'); await settle()
    expect((q('[data-slot="annotation-input"]') as HTMLTextAreaElement).value).toBe('第一版标注')
    expect(q('[data-slot="annotation-delete"]')).toBeTruthy()

    await click('[data-slot="annotation-delete"]')
    expect(annotationState.items.length).toBe(0)
    expect(q('[data-slot="annotation-dialog"]')).toBeNull()
    wrapper.unmount()
  }, 30000)
})

describe('全部标注对话框', () => {
  async function saveOne() {
    const target = [...document.querySelectorAll('main [data-pp-path]')]
      .find(el => (el.getAttribute('data-pp-path') ?? '').includes('工作台(home)'))!
    fire(target, 'mouseover'); await settle()
    fire(q('[data-slot="pp-annotate-btn"]')!, 'click'); await settle()
    const input = q('[data-slot="annotation-input"]') as HTMLTextAreaElement
    input.value = '首页指标卡待评审'
    fire(input, 'input'); await settle()
    await click('[data-slot="annotation-save"]')
  }

  it('列表展示、定位跳页 + 高亮类、清空', async () => {
    const wrapper = await mountApp()
    await saveOne()

    // 切到别的页，再从「全部标注」定位回 home
    fire(findBtn([q('aside')], '我的订单'), 'click'); await settle()
    expect(appState.currentPageId).toBe('orders')

    await click('[data-slot="annotations-open"]')
    const list = q('[data-slot="all-annotations"]')
    expect(list?.textContent).toContain('用户中心 · 工作台')
    expect(list?.textContent).toContain('首页指标卡待评审')

    // 定位：跳回 home + 元素加高亮类
    fire(findBtn([list], '定位'), 'click')
    await settle(120)
    expect(annotationState.listOpen).toBe(false)
    expect(appState.currentPageId).toBe('home')
    const flashed = document.querySelector('.pp-locate-flash')
    expect(flashed).toBeTruthy()
    expect((flashed!.getAttribute('data-pp-path') ?? '').includes('工作台(home)')).toBe(true)

    // 清空
    await click('[data-slot="annotations-open"]')
    fire(findBtn([q('[data-slot="all-annotations"]')], '清空'), 'click'); await settle()
    expect(annotationState.items.length).toBe(0)
    wrapper.unmount()
  }, 30000)
})

describe('持久化与导出', () => {
  it('loadPersisted 从 localStorage 恢复标注', async () => {
    const item: Annotation = {
      id: 't1', system: 'back', systemLabel: '数据安全大脑', pageId: 'dashboard',
      pageLabel: '安全概览', path: '/app-layout(back-desktop)/安全概览(dashboard)',
      segments: [{ name: 'app-layout', id: 'back-desktop', index: 1, kind: 'desktop' }],
      elementLabel: '安全概览(dashboard)', text: '恢复测试', createdAt: '2026-01-01T00:00:00.000Z',
    }
    localStorage.setItem('pp.annotations.v1', JSON.stringify({ version: 1, items: [item] }))
    annotationState.items = []
    loadPersisted()
    expect(annotationState.items.length).toBe(1)
    expect(annotationState.items[0].text).toBe('恢复测试')
  })

  it('buildAnnotationsMarkdown：按 系统·页面 分组，含路径与文字', () => {
    const mk = (over: Partial<Annotation>): Annotation => ({
      id: 'x', system: 'userfront', systemLabel: '用户中心', pageId: 'home', pageLabel: '工作台',
      path: '/x(home)/y', segments: [], elementLabel: 'y', text: '内容', createdAt: '2026-01-01T00:00:00.000Z',
      ...over,
    })
    const md = buildAnnotationsMarkdown([
      mk({ id: '1', elementLabel: '指标卡(stat-card#1)', text: '第一条' }),
      mk({ id: '2', path: '/x(home)/z', elementLabel: 'z', text: '第二条' }),
      mk({ id: '3', system: 'back', systemLabel: '数据安全大脑', pageId: 'dashboard', pageLabel: '安全概览', text: '另一系统' }),
    ])
    expect(md).toContain('# 原型标注导出')
    expect(md).toContain('- 标注数量：3')
    expect(md).toContain('## 用户中心 · 工作台')
    expect(md).toContain('### 指标卡(stat-card#1)')
    expect(md).toContain('`/x(home)/y`')
    expect(md).toContain('第一条')
    expect(md).toContain('## 数据安全大脑 · 安全概览')
    expect(md).toContain('另一系统')
  })

  it('损坏的持久化数据被容错忽略', () => {
    localStorage.setItem('pp.annotations.v1', '{broken json')
    annotationState.items = []
    expect(() => loadPersisted()).not.toThrow()
    expect(annotationState.items.length).toBe(0)
  })
})
