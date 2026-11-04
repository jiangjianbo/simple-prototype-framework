/**
 * 系统清单 enabled 属性：enabled: false 的原型不进入 appState.systems
 * （原型切换下拉的数据源），缺省视为启用，默认启动原型顺延为第一个启用项。
 * 用合成清单验证（不改真实 systems/index.json）；启用项的 menu/page 指向
 * 真实 back 系统文件，走完整 boot → loadSystem 链路。
 */
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '..')

const SYNTHETIC_MANIFEST = {
  defaultKit: 'shadcn',
  defaultTheme: 'light',
  systems: [
    { id: 'alpha', label: '启用原型甲', kit: 'shadcn', theme: 'light', enabled: true },
    { id: 'beta', label: '禁用原型乙', enabled: false },
    { id: 'gamma', label: '启用原型丙' },
  ],
}

beforeAll(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    if (path === '/systems/index.json') {
      const text = JSON.stringify(SYNTHETIC_MANIFEST)
      return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
    }
    // alpha/gamma 的配置指向真实 back 系统文件（目录与文件名主干一起替换）
    const mapped = path
      .replace(/^\/systems\/(alpha|gamma)\//, '/systems/back/')
      .replace(/\/(alpha|gamma)\./, '/back.')
    const file = mapped.startsWith('/systems/')
      ? join(ROOT, mapped.slice(1))
      : join(ROOT, 'public', mapped)
    if (!existsSync(file)) {
      return { ok: false, status: 404, text: async () => '', json: async () => { throw new Error('404 ' + path) } }
    }
    const text = readFileSync(file, 'utf-8')
    return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
  })
})

import App from '@/App.vue'
import { appState } from '@/framework/app-store'

const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

describe('系统清单 enabled 属性', () => {
  it('enabled:false 不进入下拉数据源；缺省视为启用；默认启动原型顺延', async () => {
    const wrapper = mount(App)
    await settle(80)

    expect(appState.status).toBe('ready')
    // 清单 3 项 → 只剩启用 2 项（缺省 enabled 视为启用）
    expect(appState.systems.map(s => s.id)).toEqual(['alpha', 'gamma'])
    // 默认启动原型 = 第一个启用项（而非清单首项被禁用时的回退混乱）
    expect(appState.system).toBe('alpha')
    // 渲染文本不出现禁用原型的 label
    expect(wrapper.text()).not.toContain('禁用原型乙')
    wrapper.unmount()
  }, 20000)
})
