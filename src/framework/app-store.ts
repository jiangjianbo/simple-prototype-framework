/**
 * 全局状态（§9.1）+ 系统加载（§9.4）
 */

import { reactive } from 'vue'
import type { MenuConfig, MetadataRegistry, Node, RenderContext, SystemEntry, SystemsManifest } from './types'
import { fetchJson, preprocessNode } from './resolver'
import { getBootstrap, goToStaticSystem, getStaticMetadata } from './static-bootstrap'
import { setMetadata } from './metadata'
import { indexTree, findFirstPage, replaceDesktop, type TreeIndex } from './navigation'
import { resetCrumbs } from './breadcrumb-store'
import { resolveStateMachines, destroyEngines } from './page-engine'
import { setKit, applyTheme, DEFAULT_KIT, DEFAULT_THEME } from './kit-store'

/** 清单级缺省套件/主题（systems/index.json 的 defaultKit/defaultTheme） */
const manifestDefaults = { kit: DEFAULT_KIT, theme: DEFAULT_THEME }

export const appState = reactive({
  status: 'loading' as 'loading' | 'ready' | 'error',
  error: '',
  system: '',
  systems: [] as SystemEntry[],
  /** 当前角色（menu.json 的 roles；缺省空 = 无角色体系，菜单全可见） */
  role: '',
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
    const boot = getBootstrap()
    // 静态构建产物：fetchJson 命中内嵌数据；服务器模式正常走网络
    const meta = boot ? getStaticMetadata() : ((await fetchJson('/metadata.json')) as MetadataRegistry)
    if (meta) setMetadata(meta)
    const manifest = await fetchJson('/systems/index.json').catch(() => ({ systems: [] }) as SystemsManifest)
    manifestDefaults.kit = manifest.defaultKit ?? DEFAULT_KIT
    manifestDefaults.theme = manifest.defaultTheme ?? DEFAULT_THEME
    appState.systems = manifest.systems ?? []
    // 静态页只内嵌了本系统的配置，默认定位到构建时指定的系统
    const first = boot?.system ?? appState.systems[0]?.id ?? 'back'
    await loadSystem(first)
  } catch (e) {
    appState.status = 'error'
    appState.error = (e as Error)?.message ?? String(e)
  }
}

export async function loadSystem(system: string) {
  // 静态模式：每个系统是独立的 dist/<系统id>/index.html，切换 = 跳转兄弟目录
  const boot = getBootstrap()
  if (boot && system !== boot.system) {
    goToStaticSystem(system)
    return
  }
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
    // 按系统声明应用套件与主题（§15）：仅切换到不同系统时生效——
    // 同系统重载（套件切换触发）保留运行时手动选择；条目级 > 清单级 > 内置缺省
    if (system !== appState.system) {
      const entry = appState.systems.find(s => s.id === system)
      setKit(entry?.kit ?? manifestDefaults.kit)
      applyTheme(entry?.theme ?? manifestDefaults.theme)
    }
    appState.desktop = desktop
    appState.menu = menu
    // 角色默认取菜单配置的第一个；无角色体系则为空（菜单全可见）
    appState.role = menu.roles?.[0]?.id ?? ''
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
