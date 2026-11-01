/**
 * 全局状态（§9.1）+ 系统加载（§9.4）
 */

import { reactive } from 'vue'
import type { MenuConfig, MetadataRegistry, Node, RenderContext } from './types'
import { fetchJson, preprocessNode } from './resolver'
import { setMetadata } from './metadata'
import { indexTree, findFirstPage, replaceDesktop, type TreeIndex } from './navigation'
import { resetCrumbs } from './breadcrumb-store'
import { resolveStateMachines, destroyEngines } from './page-engine'

export const appState = reactive({
  status: 'loading' as 'loading' | 'ready' | 'error',
  error: '',
  system: '',
  systems: [] as { id: string; label: string }[],
  desktop: null as Node | null,
  currentPageId: '',
  /** 当前激活页的节点实例（覆盖式导航克隆后与同 id 原件区分） */
  currentPageNode: null as Node | null,
  menu: null as MenuConfig | null,
})

/** 根渲染上下文（system 随系统切换更新） */
export const rootCtx = reactive({
  system: '',
  mode: 'edit',
  scope: [],
  engine: null,
}) as unknown as RenderContext

export function reindex() {
  if (appState.desktop) indexTree(appState.desktop)
}

export async function boot() {
  try {
    const meta = (await fetchJson('/metadata.json')) as MetadataRegistry
    setMetadata(meta)
    const manifest = await fetchJson('/systems/index.json').catch(() => ({ systems: [] }))
    appState.systems = manifest.systems ?? []
    const first = appState.systems[0]?.id ?? 'back'
    await loadSystem(first)
  } catch (e) {
    appState.status = 'error'
    appState.error = (e as Error)?.message ?? String(e)
  }
}

export async function loadSystem(system: string) {
  appState.status = 'loading'
  appState.error = ''
  destroyEngines()
  try {
    const [menu, pageCfg] = await Promise.all([
      fetchJson(`/systems/${system}/${system}.menu.json`),
      fetchJson(`/systems/${system}/${system}.page.json`),
    ])
    // 页面配置两种形态：{ desktop: {...} } 包装式，或根节点即 desktop 节点
    const raw = pageCfg.desktop ?? (pageCfg.type === 'desktop' ? pageCfg : null)
    const desktop = await preprocessNode(raw)
    if (!desktop) throw new Error(`系统 ${system} 的页面配置缺少 desktop 节点`)
    await resolveStateMachines(desktop)
    appState.desktop = desktop
    appState.menu = menu
    // 索引响应式代理树（而非原始对象）：导航覆盖写入必须经过 proxy 才能触发重渲染
    indexTree(desktop)
    const firstPage = findFirstPage(desktop)
    appState.currentPageId = firstPage?.id ?? ''
    appState.currentPageNode = firstPage
    appState.system = system
    rootCtx.system = system
    if (firstPage) resetCrumbs([{ pageId: firstPage.id ?? '', title: firstPage.title ?? firstPage.id ?? '' }])
    appState.status = 'ready'
  } catch (e) {
    appState.status = 'error'
    appState.error = (e as Error)?.message ?? String(e)
  }
}

export { replaceDesktop }
