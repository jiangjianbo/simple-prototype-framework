/**
 * 角色与菜单权限回归：默认角色、按角色过滤菜单、分组整组隐藏、
 * 失权页面自动回退、跨系统角色重置、角色切换器渲染。
 */
import { describe, it, expect, beforeAll, vi } from 'vitest'
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
    return {
      ok: true, status: 200,
      text: async () => text,
      json: async () => JSON.parse(text),
    }
  })
})

import App from '@/App.vue'
import { appState, loadSystem } from '@/framework/app-store'
import { setRole, filterMenuByRole } from '@/framework/role'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

const menuLabels = (wrapper: any) =>
  wrapper.findAll('aside button').map((b: any) => b.text().trim())

const h1 = (wrapper: any) => wrapper.find('main h1').text().trim()

const mountApp = async () => {
  const wrapper = mount(App)
  await settle(80)
  expect(appState.status).toBe('ready')
  return wrapper
}

describe('角色与菜单权限', () => {
  it('filterMenuByRole：白名单过滤 + 分组整组隐藏 + 无 roles 全可见', () => {
    const items = [
      { label: '公开页', pageId: 'a' },
      { label: '管理页', pageId: 'b', roles: ['admin'] },
      { label: '分组', children: [
        { label: '子项一', pageId: 'c1', roles: ['ops'] },
        { label: '子项二', pageId: 'c2', roles: ['admin'] },
      ]},
    ]
    // admin：公开页 + 管理页 + 分组里的子项二（子项一被滤掉，分组保留）
    const admin = filterMenuByRole(items as any, 'admin')
    expect(admin.map(i => i.label)).toEqual(['公开页', '管理页', '分组'])
    expect(admin[2].children!.map(i => i.label)).toEqual(['子项二'])
    // ops：公开页 + 分组只留子项一
    const ops = filterMenuByRole(items as any, 'ops')
    expect(ops.map(i => i.label)).toEqual(['公开页', '分组'])
    expect(ops[1].children!.map(i => i.label)).toEqual(['子项一'])
    // 无人可见的分组整组隐藏
    const nobody = filterMenuByRole(items as any, 'guest')
    expect(nobody.map(i => i.label)).toEqual(['公开页'])
  })

  it('back 默认角色 admin：全部菜单可见，角色切换器渲染当前角色', async () => {
    const wrapper = await mountApp()
    expect(appState.role).toBe('admin')

    const triggers = wrapper.findAll('header [data-slot="select-trigger"]')
    expect(triggers.length).toBe(4) // 系统 / 套件 / 主题 / 角色切换器
    expect(triggers[0].text()).toContain('数据安全大脑')
    expect(triggers[1].text()).toContain('精致 Shadcn')
    expect(triggers[2].text()).toContain('浅色')
    expect(triggers[3].text()).toContain('安全管理员')
    // 头像兜底字 = 角色首字
    expect(wrapper.find('header [data-slot="avatar-fallback"]').text()).toBe('安')

    const labels = menuLabels(wrapper)
    for (const t of ['安全概览', '用户列表', '用户编辑', '用户详情', '订单管理', '系统设置']) {
      expect(labels).toContain(t)
    }
    wrapper.unmount()
  }, 20000)

  it('切换 auditor：用户编辑与系统管理消失，订单/列表/详情保留', async () => {
    const wrapper = await mountApp()
    setRole('auditor'); await settle()
    expect(appState.role).toBe('auditor')

    const labels = menuLabels(wrapper)
    expect(labels).toContain('安全概览')
    expect(labels).toContain('用户列表')
    expect(labels).toContain('用户详情')
    expect(labels).toContain('订单管理')
    expect(labels).not.toContain('用户编辑')
    expect(labels).not.toContain('系统设置')
    expect(labels).not.toContain('系统管理')
    wrapper.unmount()
  }, 20000)

  it('当前页失权自动回退：编辑页上切 auditor → 回到第一个可见页', async () => {
    const wrapper = await mountApp()
    // admin 进入用户编辑页
    const btn = wrapper.findAll('aside button').find(b => b.text().trim() === '用户编辑')!
    btn.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    expect(h1(wrapper)).toBe('用户编辑')

    // 切到 auditor：用户编辑不在白名单 → 回退到第一个可见页（安全概览）
    setRole('auditor'); await settle()
    expect(h1(wrapper)).toBe('安全概览')
    wrapper.unmount()
  }, 20000)

  it('ops 可见系统设置；跨系统切换角色重置为该系统默认角色', async () => {
    const wrapper = await mountApp()
    setRole('ops'); await settle()
    expect(menuLabels(wrapper)).toContain('系统设置')
    expect(menuLabels(wrapper)).not.toContain('用户列表')

    // userfront：默认角色 member
    await loadSystem('userfront'); await settle(80)
    expect(appState.role).toBe('member')
    expect(menuLabels(wrapper)).toContain('个人资料')

    // guest 只看工作台 + 我的订单
    setRole('guest'); await settle()
    expect(menuLabels(wrapper)).not.toContain('个人资料')

    // 切回 back：角色重置为 admin，全菜单恢复
    await loadSystem('back'); await settle(80)
    expect(appState.role).toBe('admin')
    expect(menuLabels(wrapper)).toContain('用户编辑')
    wrapper.unmount()
  }, 30000)
})
