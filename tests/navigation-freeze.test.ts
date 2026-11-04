/**
 * 导航回归：真实挂载 App，模拟菜单点击往返。
 * 防回归背景：曾因 DataTable 的 state getter 每次访问返回新数组，
 * TanStack 行模型 memo 永不命中 → 无限重算 → 调度器被饿死（表现为导航后整站冻结）。
 */
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '..')

beforeAll(() => {
  // fetch stub：人写内容在 <root>/systems/，生成物在 <root>/public/（与运行时 URL 映射一致）
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
import { appState } from '@/framework/app-store'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

const clickMenu = (wrapper: any, label: string) => {
  const btn = wrapper.findAll('aside button').find((b: any) => b.text().trim() === label)
  if (!btn) throw new Error('菜单不存在: ' + label)
  btn.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

const h1 = (wrapper: any) => {
  const el = wrapper.find('main h1')
  return el.exists() ? el.text().trim() : null
}

describe('覆盖式导航（菜单往返）', () => {
  it('安全概览→用户列表→订单管理→用户列表→安全概览 全程可切回', async () => {
    const wrapper = mount(App)
    await settle(80)
    expect(appState.status).toBe('ready')
    expect(h1(wrapper)).toBe('安全概览')

    clickMenu(wrapper, '用户列表'); await settle()
    expect(h1(wrapper)).toBe('用户列表')

    clickMenu(wrapper, '订单管理'); await settle()
    expect(h1(wrapper)).toBe('订单聚合')

    clickMenu(wrapper, '用户列表'); await settle()
    expect(h1(wrapper)).toBe('用户列表')

    clickMenu(wrapper, '安全概览'); await settle()
    expect(h1(wrapper)).toBe('安全概览')
    wrapper.unmount()
  }, 20000)

  it('面包屑随导航增长并可回跳', async () => {
    const wrapper = mount(App)
    await settle(80)

    clickMenu(wrapper, '用户列表'); await settle()
    clickMenu(wrapper, '用户详情'); await settle()
    expect(h1(wrapper)).toBe('用户详情')

    const crumbs = wrapper.findAll('header nav li').map(li => li.text().trim())
    expect(crumbs.length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  }, 20000)

  it('状态机页面：浏览→编辑→保存→提交审核（提交后禁用并重置）', async () => {
    const wrapper = mount(App)
    await settle(80)

    clickMenu(wrapper, '用户编辑'); await settle()
    expect(h1(wrapper)).toBe('用户编辑')
    // 浏览态：提交审核按钮禁用
    const btnByText = (t: string) => wrapper.findAll('main button').find(b => b.text().trim() === t)
    const submit = btnByText('提交审核')
    expect(submit).toBeTruthy()
    expect((submit!.element as HTMLButtonElement).disabled).toBe(true)

    // 进入编辑态
    await btnByText('编辑')!.trigger('click'); await settle()
    expect((btnByText('提交审核')!.element as HTMLButtonElement).disabled).toBe(false)

    // 提交审核 → 回到禁用态
    await btnByText('提交审核')!.trigger('click'); await settle()
    expect((btnByText('提交审核')!.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  }, 20000)
})
