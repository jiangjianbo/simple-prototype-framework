/**
 * 页面拆分（$ref）回归（§4.6）：
 * 1. 单元：preprocessNode 的 $ref 解析 —— 相对/绝对路径、内联字段覆盖文件字段、
 *    嵌套 $ref、$ref 消失不透传、缺 base 的相对引用报错。
 * 2. 集成：userfront 拆分到 pages/ 后经 loadSystem 完整加载，页面可导航，
 *    内联覆盖（orders 的 description）生效，设计说明 note 上探测属性。
 * 3. 静态构建等价：userfront 走构建期同款组装（preprocessNode 内联 $ref 与 /file 引用）
 *    后 bootstrap 注入 + 零网络加载成功（file:// 场景）。
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf-8')
const jsonForHtml = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

/** 单元测试专用的合成文件表（优先于磁盘命中，beforeEach 清空避免跨用例污染） */
const extra: Record<string, any> = {}

beforeAll(() => {
  // fetch stub：合成表 → 磁盘。人写内容在 <root>/systems/，生成物在 <root>/public/（与运行时 URL 映射一致）
  vi.stubGlobal('fetch', async (url: string) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    if (path in extra) {
      const body = extra[path]
      return { ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body }
    }
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

beforeEach(() => {
  for (const k of Object.keys(extra)) delete extra[k]
})

import { existsSync } from 'node:fs'
import App from '@/App.vue'
import { appState, loadSystem } from '@/framework/app-store'
import { preprocessNode } from '@/framework/resolver'
import { resetBootstrapCache } from '@/framework/static-bootstrap'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

const mountApp = async () => {
  // attachTo：集成断言走 document.querySelector 与 document 级事件，应用必须挂进文档
  const wrapper = mount(App, { attachTo: document.body })
  await settle(80)
  expect(appState.status).toBe('ready')
  return wrapper
}

const clickMenu = async (label: string) => {
  const btn = [...document.querySelectorAll('aside button')]
    .find(b => b.textContent?.trim() === label)
  if (!btn) throw new Error('菜单不存在: ' + label)
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await settle()
}

const h1Text = () => document.querySelector('main h1')?.textContent?.trim() ?? null

// ---- 1. 单元：$ref 解析语义 ----
describe('preprocessNode 的 $ref 解析', () => {
  beforeEach(() => {
    extra['/systems/t/pages/a.json'] = {
      component: 'card', title: '文件标题', note: '文件说明',
      children: [{ component: 'text', text: '来自文件' }],
    }
    extra['/systems/t/pages/b.json'] = {
      component: 'card',
      children: [{ $ref: 'pages/a.json' }],
    }
  })

  it('相对路径 + base：文件内容展开，内联字段覆盖文件字段，$ref 不残留', async () => {
    const out = await preprocessNode(
      { $ref: 'pages/a.json', title: '内联标题', note: '内联说明' }, 0, 't',
    )
    expect(out.title).toBe('内联标题')        // 内联覆盖文件
    expect(out.note).toBe('内联说明')
    expect(out.component).toBe('card')        // 来自文件
    expect(out.children[0].text).toBe('来自文件')
    expect(out.$ref).toBeUndefined()          // 引用键不残留
  })

  it('绝对路径（/ 开头）：无需 base 即可解析', async () => {
    const out = await preprocessNode({ $ref: '/systems/t/pages/a.json' })
    expect(out.title).toBe('文件标题')
  })

  it('嵌套 $ref：文件内部的引用同样被递归展开', async () => {
    const out = await preprocessNode({ $ref: 'pages/b.json' }, 0, 't')
    expect(out.children[0].title).toBe('文件标题')
    expect(out.children[0].children[0].text).toBe('来自文件')
  })

  it('相对路径缺 base：明确报错（防止静默拼错路径）', async () => {
    await expect(preprocessNode({ $ref: 'pages/a.json' })).rejects.toThrow(/base/)
  })

  it('数组中的 $ref 同样展开（desktop.children 场景）', async () => {
    const out = await preprocessNode(
      { children: [{ $ref: 'pages/a.json' }] } as any, 0, 't',
    )
    expect(out.children[0].title).toBe('文件标题')
  })
})

// ---- 2. 集成：userfront 拆分后完整加载 ----
describe('userfront 拆分（pages/ 目录 + $ref）', () => {
  afterEach(() => { document.getElementById('pp-bootstrap')?.remove() })

  it('三个 $ref 页面全部加载：默认页渲染、菜单导航、内联覆盖生效', async () => {
    const wrapper = await mountApp()
    await loadSystem('userfront'); await settle(80)
    expect(appState.status).toBe('ready')
    expect(h1Text()).toBe('工作台')

    await clickMenu('我的订单')
    expect(h1Text()).toBe('我的订单')
    // description 来自 userfront.page.json 的内联覆盖（pages/orders.json 里是原文案）
    expect(document.querySelector('main')?.textContent).toContain('按下单时间倒序')

    await clickMenu('个人资料')
    expect(h1Text()).toBe('个人资料')
    wrapper.unmount()
  }, 30000)

  it('设计说明上探测属性：data-pp-path / data-pp-note 注入到元素', async () => {
    const wrapper = await mountApp()
    await loadSystem('userfront'); await settle(80)

    const paths = [...document.querySelectorAll('[data-pp-path]')]
    expect(paths.length).toBeGreaterThan(10)
    expect(paths.some(el => (el.getAttribute('data-pp-path') ?? '').includes('工作台(home)'))).toBe(true)

    const noted = document.querySelector('[data-pp-note]')
    expect(noted?.getAttribute('data-pp-note')).toContain('工作台是登录后的首屏')
    wrapper.unmount()
  }, 30000)
})

// ---- 3. 静态构建等价：构建期内联 $ref 后零网络加载 ----
describe('userfront 拆分 × 静态构建模式', () => {
  afterEach(() => { document.getElementById('pp-bootstrap')?.remove() })

  it('bootstrap 组装（preprocessNode 内联 $ref）后，file:// 零网络加载成功', async () => {
    // 构建期同款：stub fetch 读盘 → preprocessNode 把 $ref 与 /file 引用全部内联
    const pageCfg = JSON.parse(read('systems/userfront/userfront.page.json'))
    const raw = pageCfg.desktop ?? (pageCfg.type === 'desktop' ? pageCfg : null)
    const page = await preprocessNode(raw, 0, 'userfront')
    expect(JSON.stringify(page)).not.toContain('$ref')   // 构建产物无残留引用

    document.getElementById('pp-bootstrap')?.remove()
    const el = document.createElement('script')
    el.type = 'application/json'
    el.id = 'pp-bootstrap'
    el.textContent = jsonForHtml({
      system: 'userfront',
      files: {
        '/metadata.json': read('public/metadata.json'),
        '/systems/index.json': read('systems/index.json'),
        '/systems/userfront/userfront.menu.json': read('systems/userfront/userfront.menu.json'),
        '/systems/userfront/userfront.page.json': JSON.stringify(page),
      },
      assets: {
        'userfront/logo.svg': 'data:image/svg+xml;base64,',
      },
    })
    document.head.appendChild(el)
    resetBootstrapCache()

    vi.stubGlobal('fetch', async () => { throw new Error('静态模式不应发起网络请求') })

    const wrapper = mount(App, { attachTo: document.body })
    await settle(80)
    expect(appState.status).toBe('ready')
    expect(appState.system).toBe('userfront')
    expect(h1Text()).toBe('工作台')
    await clickMenu('我的订单')
    expect(h1Text()).toBe('我的订单')
    wrapper.unmount()
  }, 30000)
})
