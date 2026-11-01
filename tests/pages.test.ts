/**
 * 页面级回归：图表绘制、分组聚合交互、详情页、设置页、多系统切换。
 * 背景：IAB 浏览器 guest 在本环境不可用，这些断言以 jsdom 进程内渲染真实 App 的方式
 * 覆盖浏览器实测的关键路径（fetch 读取 systems/ 真实配置与数据）。
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
import { appState, loadSystem } from '@/framework/app-store'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

const clickMenu = (wrapper: any, label: string) => {
  const btn = wrapper.findAll('aside button').find(b => b.text().trim() === label)
  if (!btn) throw new Error('菜单不存在: ' + label)
  btn.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

const h1 = (wrapper: any) => {
  const el = wrapper.find('main h1')
  return el.exists() ? el.text().trim() : null
}

const mountApp = async () => {
  const wrapper = mount(App)
  await settle(80)
  expect(appState.status).toBe('ready')
  return wrapper
}

describe('页面级功能', () => {
  it('安全概览：stat-card 与三个 Unovis 图表均绘制出 SVG path', async () => {
    const wrapper = await mountApp()
    expect(h1(wrapper)).toBe('安全概览')

    // stat-card：接入资产 / 活跃用户 / 待处理告警 / 综合风险评分
    for (const t of ['接入资产', '活跃用户', '待处理告警', '综合风险评分']) {
      expect(wrapper.find('main').text()).toContain(t)
    }
    // 图表：area + donut + bar 都应产出可见的 path 元素（数据来自 /data/*.json）
    const paths = wrapper.findAll('main svg path')
    expect(paths.length).toBeGreaterThan(10)
    wrapper.unmount()
  }, 20000)

  it('订单聚合：分组行 + Σ 聚合徽标 + 搜索过滤 + 收起展开', async () => {
    const wrapper = await mountApp()
    clickMenu(wrapper, '订单管理'); await settle()
    expect(h1(wrapper)).toBe('订单聚合')

    // 分组行存在（首页 10 行：电子产品组完整 + 办公用品组开头），带 Σ 聚合徽标与子行数徽标
    const mainText = wrapper.find('main').text()
    for (const g of ['电子产品', '办公用品']) {
      expect(mainText).toContain(g)
    }
    expect(mainText).toContain('Σ')
    expect(mainText).toContain('第 1 / 3 页')

    // 搜索「软件订阅」→ 该品类 1 个分组行 + 4 条子行
    const search = wrapper.find('main input[placeholder="搜索…"]')
    expect(search.exists()).toBe(true)
    await search.setValue('软件订阅'); await settle()
    let trs = wrapper.findAll('main tbody tr')
    expect(trs.length).toBe(5)

    // 点击分组行首 → 收起 → 只剩分组行本身
    const groupBtn = wrapper.findAll('main tbody button').find(b => b.text().includes('软件订阅'))
    expect(groupBtn).toBeTruthy()
    await groupBtn!.trigger('click'); await settle()
    trs = wrapper.findAll('main tbody tr')
    expect(trs.length).toBe(1)

    // 再点一次 → 重新展开
    await groupBtn!.trigger('click'); await settle()
    expect(wrapper.findAll('main tbody tr').length).toBe(5)

    // 清空搜索 → 回到全量（20 子行 + 4 分组 = 24，分页后首页 10）
    await search.setValue(''); await settle()
    expect(wrapper.findAll('main tbody tr').length).toBe(10)
    wrapper.unmount()
  }, 25000)

  it('用户详情：descriptions 只读 + disabled 表单 + 返回列表 @goto 导航', async () => {
    const wrapper = await mountApp()
    clickMenu(wrapper, '用户详情'); await settle()
    expect(h1(wrapper)).toBe('用户详情')

    // descriptions 展示 @@User 值
    expect(wrapper.find('main').text()).toContain('张伟')
    expect(wrapper.find('main').text()).toContain('zhangwei@corpsafe.cn')
    // mode=disabled 表单：存在被禁用的输入控件
    const disabledInputs = wrapper.findAll('main input').filter((i: any) => (i.element as HTMLInputElement).disabled)
    expect(disabledInputs.length).toBeGreaterThan(0)

    // @goto 覆盖式导航回列表页
    const back = wrapper.findAll('main button').find(b => b.text().trim() === '返回列表')
    expect(back).toBeTruthy()
    await back!.trigger('click'); await settle()
    expect(h1(wrapper)).toBe('用户列表')
    wrapper.unmount()
  }, 20000)

  it('系统设置：edit 表单回填值 + fieldOptions 下拉 + switch', async () => {
    const wrapper = await mountApp()
    clickMenu(wrapper, '系统设置'); await settle()
    expect(h1(wrapper)).toBe('系统设置')
    expect(wrapper.find('main').text()).toContain('基础配置')

    // value 回填：siteName 输入框
    const values = wrapper.findAll('main input').map((i: any) => (i.element as HTMLInputElement).value)
    expect(values).toContain('数据安全大脑')
    // 决策矩阵：boolean → switch（role=switch）、number → input-number
    expect(wrapper.findAll('main [role="switch"]').length).toBeGreaterThan(0)
    wrapper.unmount()
  }, 20000)

  it('多系统切换：back ↔ userfront，页面/菜单/表格均随系统重建', async () => {
    const wrapper = await mountApp()
    expect(h1(wrapper)).toBe('安全概览')

    // 切到 userfront（走 loadSystem 完整加载链）
    await loadSystem('userfront'); await settle(80)
    expect(appState.system).toBe('userfront')
    expect(h1(wrapper)).toBe('工作台')
    // 侧栏插槽（小贴士 alert）随桌面配置渲染
    expect(wrapper.find('main').text()).toContain('完善资料')

    clickMenu(wrapper, '我的订单'); await settle()
    expect(h1(wrapper)).toBe('我的订单')
    expect(wrapper.find('main').text()).toContain('MO-8801')

    clickMenu(wrapper, '个人资料'); await settle()
    expect(h1(wrapper)).toBe('个人资料')
    const pfValues = wrapper.findAll('main input').map((i: any) => (i.element as HTMLInputElement).value)
    expect(pfValues.length).toBeGreaterThan(0)

    // 切回 back：菜单、页面、状态机全部回到前一系统
    await loadSystem('back'); await settle(80)
    expect(h1(wrapper)).toBe('安全概览')
    clickMenu(wrapper, '用户列表'); await settle()
    expect(h1(wrapper)).toBe('用户列表')
    wrapper.unmount()
  }, 30000)
})
