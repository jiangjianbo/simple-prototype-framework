/**
 * dev 自动刷新回归（操作手册「开发期自动刷新」）：
 * 1. 单元：setupSystemsWatch —— systems/ 内变更 debounce 合并后 full-reload；
 *    models/*.ts 先重新生成 metadata 再刷新（失败 warn 后仍刷新，期间新事件排队）；
 *    settle 窗口内存量 add 忽略；systems/ 外路径不触发。中间件 200/404 + no-store。
 * 2. 单元：parseHashState 解析。
 * 3. 集成：URL hash 保位 —— boot 恢复 hash 指定的系统/页面/角色（非法目标回落默认），
 *    navigate 切页后 hash 同步。
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { setupSystemsWatch, prototypeContent, type SystemsWatchHandles } from '../scripts/vite-prototype'

const ROOT = resolve(__dirname, '..')
const flush = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const settle = async (ms = 30) => { await new Promise(r => setTimeout(r, ms)); await flush(6) }

// ---- 1. 单元：setupSystemsWatch（注入假 watcher / reload / regenerate / 时钟） ----
describe('setupSystemsWatch 单元', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const makeHandles = () => {
    const state = {
      added: [] as string[],
      handlers: new Map<string, (p: string) => void>(),
      reloads: 0,
      regenCalls: 0,
      regenCode: 0,
      regen: async () => { state.regenCalls++; return state.regenCode },
      warns: [] as string[],
      clock: 1_000_000,
    }
    const h: SystemsWatchHandles = {
      watcher: {
        add: p => state.added.push(p),
        on: (e, fn) => state.handlers.set(e, fn),
      },
      fullReload: () => state.reloads++,
      regenerate: () => state.regen(),
      warn: m => state.warns.push(m),
      now: () => state.clock,
    }
    return { h, state }
  }
  const sys = (rel: string) => join(ROOT, 'systems', rel)
  const fire = (state: ReturnType<typeof makeHandles>['state'], evt: string, p: string) =>
    state.handlers.get(evt)!(p)

  it('注册：watcher.add 收到 systems 目录，四类事件接线', () => {
    const { h, state } = makeHandles()
    setupSystemsWatch(ROOT, h)
    expect(state.added).toEqual([join(ROOT, 'systems')])
    expect(['add', 'change', 'unlink', 'unlinkDir'].every(e => state.handlers.has(e))).toBe(true)
  })

  it('普通配置变更：debounce 合并后只整页刷新一次，不触发 metadata 重生成', () => {
    const { h, state } = makeHandles()
    setupSystemsWatch(ROOT, h)
    state.clock += 4000 // 越过 settle 窗口
    fire(state, 'change', sys('userfront/pages/orders.json'))
    fire(state, 'change', sys('userfront/userfront.menu.json'))
    expect(state.reloads).toBe(0) // 未到 debounce
    vi.advanceTimersByTime(300)
    expect(state.reloads).toBe(1)
    expect(state.regenCalls).toBe(0)
  })

  it('settle 窗口内的存量 add 忽略，窗口外的 add 触发刷新', () => {
    const { h, state } = makeHandles()
    setupSystemsWatch(ROOT, h) // registeredAt = clock
    fire(state, 'add', sys('userfront/pages/home.json'))
    vi.advanceTimersByTime(300)
    expect(state.reloads).toBe(0)
    state.clock += 3001
    fire(state, 'add', sys('userfront/pages/home.json'))
    vi.advanceTimersByTime(300)
    expect(state.reloads).toBe(1)
  })

  it('unlink / unlinkDir 同样触发；systems/ 外与 models 目录外路径不触发', () => {
    const { h, state } = makeHandles()
    setupSystemsWatch(ROOT, h)
    state.clock += 4000
    fire(state, 'unlink', sys('userfront/pages/tmp.json'))
    fire(state, 'unlinkDir', sys('deckurate/pages'))
    fire(state, 'change', join(ROOT, 'package.json'))            // systems 外
    fire(state, 'change', sys('userfront/userfront.page.json'))  // 对照组：应触发
    vi.advanceTimersByTime(300)
    expect(state.reloads).toBe(1)
  })

  it('models/*.ts：先重新生成 metadata 再刷新；生成失败 warn 后仍刷新', async () => {
    const { h, state } = makeHandles()
    setupSystemsWatch(ROOT, h)
    state.clock += 4000
    state.regenCode = 1
    fire(state, 'change', sys('back/models/User.ts'))
    expect(state.regenCalls).toBe(0)
    await vi.advanceTimersByTimeAsync(300) // flush 内 await regenerate，需异步推进
    expect(state.regenCalls).toBe(1)
    expect(state.reloads).toBe(1)
    expect(state.warns.length).toBe(1)
  })

  it('regenerate 期间再到的变更排队：合并成一次再生成 + 一次刷新', async () => {
    const { h, state } = makeHandles()
    let release!: (code: number) => void
    state.regen = () => {
      state.regenCalls++
      return new Promise<number>(r => (release = r))
    }
    setupSystemsWatch(ROOT, h)
    state.clock += 4000
    fire(state, 'change', sys('back/models/User.ts'))
    await vi.advanceTimersByTimeAsync(300) // flush 启动，regenerate 未决
    expect(state.regenCalls).toBe(1)
    expect(state.reloads).toBe(0)
    fire(state, 'change', sys('back/back.page.json')) // 期间新到的普通变更
    await vi.advanceTimersByTimeAsync(300)            // debounce 到期，排队等待
    expect(state.reloads).toBe(0)
    release(0)
    await vi.advanceTimersByTimeAsync(300)
    expect(state.regenCalls).toBe(1) // 两类变更合并：只再生成一次
    expect(state.reloads).toBe(1)    // 只刷新一次
  })
})

// ---- 2. 单元：中间件映射 + no-store ----
describe('pp-prototype-content 中间件', () => {
  let mw: (req: { url?: string }, res: any, next: () => void) => void
  const watcherState = { added: [] as string[] }
  beforeAll(() => {
    const plugin = prototypeContent(ROOT)
    const server = {
      middlewares: { use: (fn: typeof mw) => (mw = fn) },
      watcher: { add: (p: string) => watcherState.added.push(p), on: () => {} },
      ws: { send: () => {} },
      config: { logger: { warn: () => {} } },
    }
    // 不触发 watcher 事件，configureServer 内的 regenerate（spawn npm）不会被调用
    ;(plugin as { configureServer?: (s: unknown) => void }).configureServer!(server)
  })

  const makeRes = () => {
    const res = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: '',
      setHeader(k: string, v: string) { res.headers[k] = v },
      end(b?: string) { if (b != null) res.body = b },
    }
    return res
  }

  it('configureServer 同时注册 watcher（dev 自动刷新接线）', () => {
    expect(watcherState.added).toEqual([join(ROOT, 'systems')])
  })

  it('/systems/* → 200 + 对应 MIME + Cache-Control: no-store', () => {
    const res = makeRes()
    mw({ url: '/systems/userfront/pages/home.json?x=1' }, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(res.headers['Content-Type']).toBe('application/json')
    expect(res.headers['Cache-Control']).toBe('no-store')
    expect(String(res.body)).toContain('"component"')
  })

  it('越界路径 / 不存在文件 / 非白名单扩展名 → 404；非 /systems 前缀 → next', () => {
    for (const url of ['/systems/../package.json', '/systems/nope.json', '/systems/back/x.ts']) {
      const res = makeRes()
      mw({ url }, res, () => {})
      expect(res.statusCode).toBe(404)
    }
    let nexted = false
    const res = makeRes()
    mw({ url: '/metadata.json' }, res, () => (nexted = true))
    expect(nexted).toBe(true)
    expect(res.statusCode).toBe(200)
  })
})

// ---- 3. 单元：parseHashState ----
describe('parseHashState', () => {
  it('完整形态：#/<系统>/<页面>?role=<角色>', async () => {
    const { parseHashState } = await import('@/framework/app-store')
    expect(parseHashState('#/back/user-list?role=auditor')).toEqual({
      system: 'back', pageId: 'user-list', role: 'auditor',
    })
    expect(parseHashState('#/userfront/orders')).toEqual({ system: 'userfront', pageId: 'orders', role: '' })
    expect(parseHashState('')).toEqual({ system: '', pageId: '', role: '' })
    expect(parseHashState('#/back?role=ops')).toEqual({ system: 'back', pageId: '', role: 'ops' })
  })
})

// ---- 4. 集成：URL hash 保位 ----
describe('URL hash 保位（boot 恢复 + navigate 同步）', () => {
  beforeAll(() => {
    // fetch stub：/systems/* → 仓库磁盘，其余（/metadata.json）→ public/
    vi.stubGlobal('fetch', async (url: string) => {
      const path = String(url).split('?')[0]
      const file = path.startsWith('/systems/') ? join(ROOT, path.slice(1)) : join(ROOT, 'public', path)
      if (!existsSync(file)) {
        return { ok: false, status: 404, text: async () => '', json: async () => { throw new Error('404 ' + path) } }
      }
      const text = readFileSync(file, 'utf-8')
      return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
    })
  })

  const mountAt = async (hash: string) => {
    location.hash = hash
    const wrapper = mount((await import('@/App.vue')).default, { attachTo: document.body })
    await settle(80)
    expect(appState.status).toBe('ready')
    return wrapper
  }
  const h1 = () => document.querySelector('main h1')?.textContent?.trim() ?? null

  let appState!: typeof import('@/framework/app-store').appState
  beforeAll(async () => { appState = (await import('@/framework/app-store')).appState })
  afterEach(() => { document.body.innerHTML = '' })

  it('boot 恢复 hash 指定的系统与页面（userfront/orders）', async () => {
    const w = await mountAt('#/userfront/orders')
    expect(appState.system).toBe('userfront')
    expect(appState.currentPageId).toBe('orders')
    expect(h1()).toBe('我的订单')
    w.unmount()
  }, 30000)

  it('角色随 hash 恢复（back 系统 auditor），页面不合法回落首页面', async () => {
    const w = await mountAt('#/back/user-list?role=auditor')
    expect(appState.system).toBe('back')
    expect(appState.role).toBe('auditor')
    expect(appState.currentPageId).toBe('user-list')
    w.unmount()

    const w2 = await mountAt('#/userfront/no-such-page')
    expect(appState.currentPageId).toBe('home') // 回落第一个页面
    expect(appState.role).toBe('member')        // 回落第一个角色
    w2.unmount()
  }, 30000)

  it('非法系统回落清单第一个；无 hash 走默认', async () => {
    const w = await mountAt('#/nope/whatever')
    expect(appState.system).toBe('back')
    expect(appState.status).toBe('ready')
    w.unmount()

    const w2 = await mountAt('')
    expect(appState.system).toBe('back')
    w2.unmount()
  }, 30000)

  it('navigate 切页后 hash 同步（replaceState 语义）', async () => {
    const w = await mountAt('#/userfront/orders')
    const btn = [...document.querySelectorAll('aside button')].find(b => b.textContent?.trim() === '工作台')
    btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    expect(appState.currentPageId).toBe('home')
    expect(location.hash).toBe('#/userfront/home?role=member')
    w.unmount()
  }, 30000)
})
