/**
 * vite 插件：systems/ 内容服务 + 开发期变更自动刷新。
 *
 * - 内容映射：dev 中间件把 /systems/* URL 按请求现读磁盘（无缓存 + no-store，
 *   刷新必然拿到最新配置）；build 时 closeBundle 整体拷贝到 dist/systems。
 * - 自动刷新：dev 下监听 systems/ 全目录（vite 自带 chokidar 实例，显式 add——
 *   systems/ 不在模块图内默认不被监听），变更 → debounce 合并 → ws full-reload；
 *   models/*.ts 变更先重新生成 public/metadata.json 再刷新。
 *   刷新后的位置（系统/页面/角色）由 app-store 的 URL hash 恢复保住。
 */
import { spawn } from 'node:child_process'
import { cpSync, existsSync, readFileSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'

const MIME: Record<string, string> = {
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown',
  '.png': 'image/png',
  '.css': 'text/css',
  '.js': 'text/javascript',
}

/** watcher 依赖的最小接口（单测可注入假实现；真实环境是 vite 的 chokidar 实例） */
export interface WatcherLike {
  add(path: string): unknown
  on(event: string, listener: (path: string) => void): unknown
}

export interface SystemsWatchHandles {
  watcher: WatcherLike
  /** 触发浏览器整页刷新（vite: server.ws.send({ type: 'full-reload' })） */
  fullReload(): void
  /** 重新生成 public/metadata.json；resolve 退出码（0 = 成功） */
  regenerate(): Promise<number>
  warn(message: string): void
  now(): number
}

const DEBOUNCE_MS = 300
/** watcher.add() 会对存量文件触发一次 'add'（chokidar 已知行为），忽略注册后短窗口内的 add */
const SETTLE_MS = 3000

/**
 * systems/ 变更监听核心（从插件抽出便于单测）：
 * - 普通 JSON/素材/状态机变更 → debounce 合并 → fullReload
 * - models/*.ts 变更 → debounce 后先 regenerate（串行，期间新到的变更排队再跑）→ fullReload
 */
export function setupSystemsWatch(root: string, h: SystemsWatchHandles): void {
  const contentDir = resolve(root, 'systems')
  const registeredAt = h.now()
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingModels = false
  let pendingContent = false
  let flushing = false

  const inContent = (p: string) => p.startsWith(contentDir + sep)
  const isModel = (p: string) => /^[^/]+\/models\/[^/]+\.ts$/.test(p.slice(contentDir.length + 1))

  const flush = async () => {
    if (flushing) return
    flushing = true
    try {
      // 再生的变更（debounce 窗口外又存了盘）排队重跑，直到清空
      while (pendingModels || pendingContent) {
        if (pendingModels) {
          pendingModels = false
          const code = await h.regenerate()
          if (code !== 0) h.warn(`gen:metadata 退出码 ${code}，元数据可能过期，页面仍按最新 JSON 刷新`)
        }
        pendingContent = false
        h.fullReload()
      }
    } finally {
      flushing = false
    }
  }

  const onEvent = (event: string, rawPath: string) => {
    const p = normalize(String(rawPath))
    if (!inContent(p)) return
    if (event === 'add' && h.now() - registeredAt < SETTLE_MS) return // 注册扫描的存量 add
    if (isModel(p)) pendingModels = true
    else pendingContent = true
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      void flush()
    }, DEBOUNCE_MS)
  }

  h.watcher.add(contentDir)
  for (const evt of ['add', 'change', 'unlink', 'unlinkDir']) h.watcher.on(evt, p => onEvent(evt, p))
}

/**
 * 把 systems/ 目录映射到 Web 根路径 /systems：
 * - dev：Connect 中间件按请求读盘（改配置后自动整页刷新，见 setupSystemsWatch）
 * - build：closeBundle 阶段整体拷贝到 dist/systems（preview 同样可用）
 */
export function prototypeContent(root: string): Plugin {
  const contentDir = resolve(root, 'systems')
  return {
    name: 'pp-prototype-content',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (!url.startsWith('/systems/')) return next()
        const file = normalize(join(contentDir, url.slice('/systems/'.length)))
        const inside = file.startsWith(contentDir + sep)
        if (!inside || !existsSync(file) || !/\.(json|svg|md|png|css|js)$/.test(file)) {
          res.statusCode = 404
          return res.end('not found')
        }
        res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-store')
        res.end(readFileSync(file))
      })
      setupSystemsWatch(root, {
        watcher: server.watcher,
        fullReload: () => server.ws.send({ type: 'full-reload' }),
        regenerate: () =>
          new Promise(resolveCode => {
            const child = spawn('npm', ['run', 'gen:metadata'], { cwd: root, stdio: 'ignore' })
            child.on('error', () => resolveCode(-1))
            child.on('exit', code => resolveCode(code ?? -1))
          }),
        warn: msg => server.config.logger.warn(msg),
        now: () => Date.now(),
      })
    },
    closeBundle() {
      cpSync(contentDir, resolve(root, 'dist/systems'), { recursive: true })
    },
  }
}
