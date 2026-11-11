/**
 * 全局状态（§9.1）+ 系统加载（§9.4）
 */

import { reactive, watch } from 'vue'
import type { MenuConfig, MetadataRegistry, Node, RenderContext, SystemEntry, SystemsManifest } from './types'
import { fetchJson, preprocessNode } from './resolver'
import { getBootstrap, goToStaticSystem, getStaticMetadata } from './static-bootstrap'
import { setMetadata } from './metadata'
import { indexTree, findFirstPage, replaceDesktop, nodeTypeOf, type TreeIndex } from './navigation'
import { resetCrumbs } from './breadcrumb-store'
import { resolveStateMachines, destroyEngines } from './page-engine'
import { setKit, applyTheme, DEFAULT_KIT, DEFAULT_THEME } from './kit-store'
import { loadPersisted } from './annotation-store'

/** 清单级缺省套件/主题（systems/index.json 的 defaultKit/defaultTheme） */
const manifestDefaults = { kit: DEFAULT_KIT, theme: DEFAULT_THEME }

/** loadSystem 的恢复参数：URL hash 记录的页面/角色（dev 自动刷新与手动 F5 保位） */
export interface RestoreState {
  pageId?: string
  role?: string
}

/**
 * 解析 URL hash：`#/<系统id>/<页面id>?role=<角色id>`（页面/角色可省略）。
 * 返回空 system 表示无有效恢复目标。
 */
export function parseHashState(hash: string): { system: string; pageId: string; role: string } {
  const raw = hash.replace(/^#\/?/, '')
  const [pathPart, queryPart] = raw.split('?')
  const segs = pathPart.split('/').filter(Boolean)
  const role = new URLSearchParams(queryPart ?? '').get('role') ?? ''
  return { system: segs[0] ?? '', pageId: segs[1] ?? '', role }
}

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

watch([() => appState.system, () => appState.currentPageId, () => appState.role], () => {
  if (!appState.system) return
  let hash = `/${appState.system}`
  if (appState.currentPageId) hash += `/${appState.currentPageId}`
  if (appState.role) hash += `?role=${encodeURIComponent(appState.role)}`
  if (location.hash !== `#${hash}`) history.replaceState(null, '', `#${hash}`)
})

export function reindex() {
  if (appState.desktop) indexTree(appState.desktop)
}

export async function boot() {
  try {
    loadPersisted()
    const boot = getBootstrap()
    // 静态构建产物：fetchJson 命中内嵌数据；服务器模式正常走网络
    const meta = boot ? getStaticMetadata() : ((await fetchJson('/metadata.json')) as MetadataRegistry)
    if (meta) setMetadata(meta)
    const manifest = await fetchJson('/systems/index.json').catch(() => ({ systems: [] }) as SystemsManifest)
    manifestDefaults.kit = manifest.defaultKit ?? DEFAULT_KIT
    manifestDefaults.theme = manifest.defaultTheme ?? DEFAULT_THEME
    appState.systems = (manifest.systems ?? []).filter((s: SystemEntry) => s.enabled !== false)
    // URL hash 恢复（dev 自动刷新/手动 F5 保位）：dev 模式 hash 系统须在清单内，
    // 静态模式只允许恢复到本系统（跨系统是独立单文件页）
    const hs = parseHashState(location.hash)
    const hashOk = boot ? hs.system === boot.system : appState.systems.some(s => s.id === hs.system)
    // 静态页只内嵌了本系统的配置，默认定位到构建时指定的系统
    const first = (hashOk && hs.system) || boot?.system || appState.systems[0]?.id || 'back'
    const restore: RestoreState | undefined = hashOk
      ? { pageId: hs.pageId || undefined, role: hs.role || undefined }
      : undefined
    await loadSystem(first, restore)
  } catch (e) {
    appState.status = 'error'
    appState.error = (e as Error)?.message ?? String(e)
  }
}

/**
 * 加载系统。restore 传入 URL hash 记录的页面/角色（刷新保位）：
 * 目标页面/角色不存在时回落默认（第一个页面 / 第一个角色）。
 */
export async function loadSystem(system: string, restore?: RestoreState) {
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
    // base = 系统 id：$ref 拆分引用相对 systems/<系统id>/ 解析（§4.6）
    const raw = pageCfg.desktop ?? (pageCfg.type === 'desktop' ? pageCfg : null)
    const desktop = await preprocessNode(raw, 0, system)
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
    // 角色默认取菜单配置的第一个；无角色体系则为空（菜单全可见）；
    // 恢复目标角色须在菜单角色表内，否则回落默认
    const roles: NonNullable<MenuConfig['roles']> = menu.roles ?? []
    appState.role =
      restore?.role && roles.some(r => r.id === restore.role) ? restore.role : (roles[0]?.id ?? '')
    // 索引响应式代理树（而非原始对象）：导航覆盖写入必须经过 proxy 才能触发重渲染
    const idx = indexTree(desktop)
    // 恢复到 URL 记录的页面（须为 page 节点），否则回落第一个页面
    const restored = restore?.pageId ? idx.byId.get(restore.pageId) : undefined
    const firstPage = restored && nodeTypeOf(restored) === 'page' ? restored : findFirstPage(desktop)
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
