/**
 * 静态构建（npm run build 的第三步，vite build 之后执行）：
 *
 * 为 systems/index.json 里的每个系统生成 dist/<系统id>/index.html ——
 * 双击即可在文件系统直接打开（file:// 协议），无需任何服务器。
 *
 * 为什么全部内联：file:// 协议下浏览器会因 CORS 拒绝两类请求——
 *   1. fetch JSON（运行期配置/数据）；
 *   2. <script type="module" src="..."> 外链模块脚本（Chrome/Firefox 直接拦截）。
 * 因此每个静态页做成完全自包含的单文件：
 *   - vite 产物 JS/CSS → 内联为 <script>/<style> 块；
 *   - 运行期需要加载的全部文本（metadata、系统清单、menu/page 配置、/file 引用
 *     已在构建期内联的数据、状态机 .sm.md 源文本）→ 内嵌
 *     <script type="application/json" id="pp-bootstrap"> 数据块，
 *     运行时 fetchJson/fetchText 命中 static-bootstrap 的 files 表；
 *   - `@/` 资源引用 → base64 data URL（resolveAssetUrl 命中 assets 表）。
 *
 * dist/index.html 本身保留：服务器模式入口（vite preview / 任意静态服务器），
 * 多系统在应用内下拉切换；静态页内切系统则跳转兄弟目录的 index.html。
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preprocessNode } from '../src/framework/resolver'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const DIST = join(ROOT, 'dist')
const SYSTEMS = join(ROOT, 'systems')
const BOOTSTRAP_ID = 'pp-bootstrap'

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

/** URL → 磁盘文件：/systems/... ⇔ systems/...，其余（/metadata.json）⇔ public/... */
function urlToFile(url: string): string {
  const path = url.split('?')[0]
  return path.startsWith('/systems/')
    ? join(SYSTEMS, path.slice('/systems/'.length))
    : join(ROOT, 'public', path)
}

/** 构建期内替换全局 fetch，让 src/framework/resolver 的 preprocessNode 直接读盘 */
function installDiskFetch() {
  ;(globalThis as any).fetch = async (url: string) => {
    const file = urlToFile(String(url))
    if (!existsSync(file)) {
      return { ok: false, status: 404, text: async () => '', json: async () => { throw new Error(`404 ${url}`) } }
    }
    const text = readFileSync(file, 'utf-8')
    return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) }
  }
}

/** 递归收集树里的引用：`@/` 资源与 `__smSrc` 状态机（/file 引用已被 preprocessNode 内联） */
function collectRefs(node: any, out: { assets: Set<string>; smPaths: Set<string> }) {
  if (node == null) return
  if (Array.isArray(node)) {
    for (const n of node) collectRefs(n, out)
    return
  }
  if (typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    if (k === '__smSrc' && Array.isArray(v)) {
      for (const p of v) if (typeof p === 'string') out.smPaths.add(p)
    } else if (typeof v === 'string' && v.startsWith('@/')) {
      out.assets.add(v.slice(2))
    } else {
      collectRefs(v, out)
    }
  }
}

/** JSON 安全地内嵌进 HTML：全部 `<` 转义为 \u003c（合法 JSON 转义，且不会截断 script 块） */
function jsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * JS 安全地内联进 <script> 块：转义 `</script` 与 `<!--`。
 * 两处转义在字符串/模板字面量与正则里语义不变（`\/`→`/`、`\!`→`!`）。
 */
function jsForHtml(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')
}

function toDataUrl(file: string): string | null {
  const mime = MIME[extname(file).toLowerCase()]
  if (!mime) return null
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`
}

async function main() {
  const shellPath = join(DIST, 'index.html')
  if (!existsSync(shellPath)) throw new Error('未找到 dist/index.html，请先执行 vite build')
  const shell = readFileSync(shellPath, 'utf-8')

  // 提取 vite 构建产物：module script 与 stylesheet 均改为内联（file:// 直开的硬要求）
  const jsMatch = shell.match(/<script type="module"[^>]*src="[^"]*assets\/([^"]+)"[^>]*><\/script>/)
  const cssMatch = shell.match(/<link rel="stylesheet"[^>]*href="[^"]*assets\/([^"]+)"[^>]*>/)
  if (!jsMatch || !cssMatch) throw new Error('无法从 dist/index.html 识别构建产物引用（期望 assets/*.js 与 assets/*.css）')
  const jsCode = readFileSync(join(DIST, 'assets', jsMatch[1]), 'utf-8')
  const cssCode = readFileSync(join(DIST, 'assets', cssMatch[1]), 'utf-8')

  const inlinedShell = shell
    .replace(/<script type="module"[^>]*><\/script>/, () => `<script type="module">\n${jsForHtml(jsCode)}\n</script>`)
    .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>\n${cssCode}\n</style>`)

  installDiskFetch()

  const manifest = JSON.parse(readFileSync(join(SYSTEMS, 'index.json'), 'utf-8'))
  const metadataText = readFileSync(join(ROOT, 'public', 'metadata.json'), 'utf-8')

  for (const system of manifest.systems) {
    const id: string = system.id
    // enabled: false = 手工下架：不产出静态页（下拉列表同样由 boot 过滤）
    if (system.enabled === false) {
      console.log(`[static] 跳过禁用系统: ${id}`)
      continue
    }
    const menuPath = `/systems/${id}/${id}.menu.json`
    const pagePath = `/systems/${id}/${id}.page.json`
    const menuText = readFileSync(urlToFile(menuPath), 'utf-8')
    const pageCfg = JSON.parse(readFileSync(urlToFile(pagePath), 'utf-8'))

    // 与运行时 loadSystem 同链路：内联 /file 引用（两种页面配置形态都支持）
    const raw = pageCfg.desktop ?? (pageCfg.type === 'desktop' ? pageCfg : null)
    const page = await preprocessNode(raw)
    if (!page) throw new Error(`系统 ${id} 的页面配置缺少 desktop 节点`)

    // 收集状态机源文本与 @/ 资源
    const refs = { assets: new Set<string>(), smPaths: new Set<string>() }
    collectRefs(page, refs)

    const files: Record<string, string> = {
      '/metadata.json': metadataText,
      '/systems/index.json': JSON.stringify(manifest),
      [menuPath]: menuText,
      [pagePath]: JSON.stringify(page),
    }
    for (const p of refs.smPaths) {
      const file = urlToFile(p)
      if (!existsSync(file)) throw new Error(`系统 ${id} 状态机文件不存在: ${p}`)
      files[p] = readFileSync(file, 'utf-8')
    }

    const assets: Record<string, string> = {}
    for (const name of refs.assets) {
      const file = join(SYSTEMS, id, 'assets', name)
      const dataUrl = existsSync(file) ? toDataUrl(file) : null
      if (!dataUrl) throw new Error(`系统 ${id} 资源不存在或格式不支持: @/${name}`)
      assets[`${id}/${name}`] = dataUrl
    }

    const bootstrapBlock = `    <script type="application/json" id="${BOOTSTRAP_ID}">${jsonForHtml({ system: id, files, assets })}</script>`
    // 每个系统的静态页用自己的标题；title 缺失时兜底注入 </head> 前
    let html = inlinedShell.replace(
      /<title>.*?<\/title>/s,
      () => `<title>${escapeHtml(String(system.label ?? id))} · 原型系统</title>\n${bootstrapBlock}`,
    )
    if (html === inlinedShell) html = inlinedShell.replace('</head>', `${bootstrapBlock}\n  </head>`)

    const dir = join(DIST, id)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)

    const kb = (n: string) => `${(Buffer.byteLength(n, 'utf-8') / 1024).toFixed(0)} kB`
    console.log(
      `[static] dist/${id}/index.html  (${kb(html)}, 自包含单文件)  sm:${refs.smPaths.size}  assets:${Object.keys(assets).length}`,
    )
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
