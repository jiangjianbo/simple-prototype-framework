/**
 * 静态构建模式回归：把真实配置按构建期同样链路（preprocessNode 内联 /file 与 $ref 引用）
 * 组装成 bootstrap 数据块注入 jsdom，fetch 一律禁止 —— 验证 file:// 直开场景下
 * 应用能完整加载、状态机可用、菜单角色过滤生效、资源引用命中内嵌 data URL、
 * 切系统走兄弟静态页跳转而非进程内重载、$ref 拆分页内容已内联、hash 保位
 * （本系统页面/角色恢复，跨系统 hash 回落本系统默认）。
 *
 * scripts/build-static.ts 用的是同一套组装逻辑，此处是对其产物运行时行为的等价验证。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '..')

/** 与 scripts/build-static.ts 一致：全部 `<` 转义，避免截断 script 块 */
const jsonForHtml = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

const read = (p: string) => readFileSync(join(ROOT, p), 'utf-8')

/** 构建期同款读盘 stub（scripts/build-static.ts 的 installDiskFetch） */
const stubDiskFetch = () => {
  vi.stubGlobal('fetch', async (url: string) => {
    const path = String(url).split('?')[0]
    const file = path.startsWith('/systems/')
      ? join(ROOT, path.slice(1))
      : join(ROOT, 'public', path)
    const text = readFileSync(file, 'utf-8')
    return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
  })
}

/** 构建期同款组装：读盘 + preprocessNode 内联 /file 引用（临时 stub fetch 到磁盘） */
async function buildBackBootstrap() {
  stubDiskFetch()
  const pageCfg = JSON.parse(read('systems/back/back.page.json'))
  const page = await preprocessNode(pageCfg.desktop)
  return {
    system: 'back',
    files: {
      '/metadata.json': read('public/metadata.json'),
      '/systems/index.json': read('systems/index.json'),
      '/systems/back/back.menu.json': read('systems/back/back.menu.json'),
      '/systems/back/back.page.json': JSON.stringify(page),
      '/systems/back/pages/user-info.sm.md': read('systems/back/pages/user-info.sm.md'),
    },
    assets: {
      'back/brain.svg': 'data:image/svg+xml;base64,' + readFileSync(join(ROOT, 'systems/back/assets/brain.svg')).toString('base64'),
    },
  }
}

/** userfront：$ref 拆分页系统。base=id 必传，两种配置形态与 build-static.ts L157 一致 */
async function buildUserfrontBootstrap() {
  stubDiskFetch()
  const pageCfg = JSON.parse(read('systems/userfront/userfront.page.json'))
  const raw = pageCfg.desktop ?? (pageCfg.type === 'desktop' ? pageCfg : null)
  const page = await preprocessNode(raw, 0, 'userfront')
  return {
    system: 'userfront',
    files: {
      '/metadata.json': read('public/metadata.json'),
      '/systems/index.json': read('systems/index.json'),
      '/systems/userfront/userfront.menu.json': read('systems/userfront/userfront.menu.json'),
      '/systems/userfront/userfront.page.json': JSON.stringify(page),
    },
    assets: {
      'userfront/logo.svg': 'data:image/svg+xml;base64,' + readFileSync(join(ROOT, 'systems/userfront/assets/logo.svg')).toString('base64'),
    },
  }
}

function injectBootstrap(payload: unknown) {
  document.getElementById('pp-bootstrap')?.remove()
  const el = document.createElement('script')
  el.type = 'application/json'
  el.id = 'pp-bootstrap'
  el.textContent = jsonForHtml(payload)
  document.head.appendChild(el)
  // 组装期间 preprocessNode 可能已把缓存污染为 null（真实产物里脚本块先于应用存在，无此问题）
  resetBootstrapCache()
}

/** 静态模式下不允许任何网络请求：file:// 直开时 fetch 本就不可用 */
const stubNoNetwork = () => {
  vi.stubGlobal('fetch', async (url: unknown) => {
    throw new Error(`静态模式不应发起网络请求: ${String(url)}`)
  })
}

import App from '@/App.vue'
import { appState, loadSystem } from '@/framework/app-store'
import { setRole } from '@/framework/role'
import { preprocessNode, resolveAssetUrl } from '@/framework/resolver'
import { resetBootstrapCache, setStaticNavigator } from '@/framework/static-bootstrap'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }
const h1 = (wrapper: any) => wrapper.find('main h1').text().trim()
const menuLabels = (wrapper: any) => wrapper.findAll('aside button').map((b: any) => b.text().trim())

beforeEach(() => {
  resetBootstrapCache()
})

afterEach(() => {
  document.getElementById('pp-bootstrap')?.remove()
})

describe('静态构建模式（file:// 直开）', () => {
  it('bootstrap 内嵌数据完整加载：页面渲染 + 状态机 + 角色 + 资源 data URL + 零网络请求', async () => {
    injectBootstrap(await buildBackBootstrap())
    stubNoNetwork()

    const wrapper = mount(App)
    await settle(80)
    expect(appState.status).toBe('ready')
    expect(appState.system).toBe('back')
    expect(h1(wrapper)).toBe('安全概览')

    // 角色：菜单读取内嵌 menu.json，默认角色 admin
    expect(appState.role).toBe('admin')
    expect(menuLabels(wrapper)).toContain('用户编辑')

    // 状态机页可用（.sm.md 来自内嵌 files 表，无状态机错误告警）
    const btn = wrapper.findAll('aside button').find(b => b.text().trim() === '用户编辑')!
    btn.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    expect(h1(wrapper)).toBe('用户编辑')
    expect(wrapper.find('main').text()).not.toContain('状态机错误')

    // 失权回退：用户编辑仅 admin 可见，切 auditor 后回到第一个可见页
    setRole('auditor'); await settle()
    expect(h1(wrapper)).toBe('安全概览')
    expect(menuLabels(wrapper)).not.toContain('用户编辑')

    // @/ 资源命中内嵌 data URL（侧栏图标 brain.svg）
    expect(resolveAssetUrl('@/brain.svg', 'back')).toMatch(/^data:image\/svg\+xml;base64,/)

    // 全程零网络请求（fetch stub 一旦被调用就会抛错，能走到这里即证明）
    wrapper.unmount()
  }, 20000)

  it('静态模式切系统 = 跳转兄弟目录静态页，不做进程内重载', async () => {
    injectBootstrap(await buildBackBootstrap())
    stubNoNetwork()

    const urls: string[] = []
    setStaticNavigator(url => urls.push(url))
    const wrapper = mount(App)
    await settle(80)
    expect(appState.status).toBe('ready')

    await loadSystem('userfront')
    expect(urls).toEqual(['../userfront/index.html'])
    // 跳转语义：当前系统保持不变（由目标静态页自己加载 userfront）
    expect(appState.system).toBe('back')
    setStaticNavigator(url => window.location.assign(url))
    wrapper.unmount()
  }, 20000)

  it('$ref 拆分页：构建期内联进页面树，零网络可渲染；切页后静态页同样写 hash 保位', async () => {
    injectBootstrap(await buildUserfrontBootstrap())
    stubNoNetwork()

    const wrapper = mount(App)
    await settle(80)
    expect(appState.status, `boot error: ${appState.error}`).toBe('ready')
    expect(appState.system).toBe('userfront')

    // 我的订单 = pages/orders.json 拆分页：内容已在构建期随 $ref 内联，点击即可渲染
    const btn = wrapper.findAll('aside button').find(b => b.text().trim() === '我的订单')!
    btn.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    expect(h1(wrapper)).toBe('我的订单')
    // 静态模式同样写 URL hash（刷新/分享链接保位），角色为菜单第一个
    expect(location.hash).toBe('#/userfront/orders?role=member')
    wrapper.unmount()
  }, 20000)

  it('hash 保位：boot 恢复本系统页面与角色；跨系统 hash 整体回落本系统默认', async () => {
    injectBootstrap(await buildBackBootstrap())
    stubNoNetwork()

    location.hash = '#/back/user-list?role=auditor'
    const wrapper = mount(App)
    await settle(80)
    expect(appState.system).toBe('back')
    expect(appState.currentPageId).toBe('user-list')
    expect(appState.role).toBe('auditor')
    wrapper.unmount()

    // hash 指向其它系统：静态页只内嵌了本系统配置，回落默认（首角色 + 首页面）
    location.hash = '#/userfront/orders'
    const wrapper2 = mount(App)
    await settle(80)
    expect(appState.system).toBe('back')
    expect(appState.role).toBe('admin')
    expect(h1(wrapper2)).toBe('安全概览')
    wrapper2.unmount()
  }, 20000)
})
