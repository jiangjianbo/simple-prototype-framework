/**
 * 静态构建模式（file:// 直开）的运行时数据层。
 *
 * `npm run build` 会为每个系统生成 dist/<系统id>/index.html：所有运行期需要
 * fetch 的内容（metadata、系统清单、menu/page 配置、内联后的数据文件、
 * 状态机 .sm.md 源文本）都以原始文本形式内嵌在页面内的
 * `<script type="application/json" id="pp-bootstrap">` 块里，`@/` 资源转为
 * data URL 内嵌。运行时 fetchJson/fetchText/resolveAssetUrl 优先命中这里，
 * 从而在 file:// 协议下零网络请求。
 *
 * 服务器模式（dev / dist/index.html + vite preview）下不存在该节点，一切照旧。
 */

import type { MetadataRegistry } from './types'

export interface StaticBootstrap {
  /** 当前静态页对应的系统 id（切到其它系统 = 跳转兄弟目录的 index.html） */
  system: string
  /** 路径 → 原始文本（与运行时 fetch 的 Web 路径一一对应） */
  files: Record<string, string>
  /** `<系统id>/<文件名>` → data URL（`@/` 资源引用） */
  assets: Record<string, string>
}

const BOOTSTRAP_ID = 'pp-bootstrap'

let cached: StaticBootstrap | null | undefined

/** 读页面内嵌的 bootstrap（仅静态构建产物里存在）；结果缓存，无则 null */
export function getBootstrap(): StaticBootstrap | null {
  if (cached !== undefined) return cached
  try {
    // node 侧（构建脚本复用 preprocessNode）无 document，视为无 bootstrap
    const el = typeof document === 'undefined' ? null : document.getElementById(BOOTSTRAP_ID)
    cached = el?.textContent ? (JSON.parse(el.textContent) as StaticBootstrap) : null
  } catch {
    console.warn('[static] bootstrap 数据块解析失败，回退到 fetch 模式')
    cached = null
  }
  return cached
}

/** 仅测试用：清空缓存（jsdom 每个用例重新挂载时需要） */
export function resetBootstrapCache() {
  cached = undefined
}

export function isStaticMode(): boolean {
  return getBootstrap() !== null
}

export function getStaticMetadata(): MetadataRegistry | null {
  const raw = getBootstrap()?.files['/metadata.json']
  return raw ? (JSON.parse(raw) as MetadataRegistry) : null
}

/** 静态模式下切系统 = 跳转到兄弟目录的同构静态页（file:// 与 http:// 均可用） */
let navigateHandler: (url: string) => void = url => window.location.assign(url)

/** 测试可注入导航（jsdom 的 location.assign 不可 spy） */
export function setStaticNavigator(fn: (url: string) => void) {
  navigateHandler = fn
}

export function goToStaticSystem(system: string) {
  navigateHandler(`../${system}/index.html`)
}
