import { cpSync, existsSync, readFileSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// 人写内容统一放在 <root>/systems/（文件路径与运行时 URL 一一对应：
// systems/back/... ⇔ /systems/back/...）；public/ 只存放生成产物（metadata.json）。
const MIME: Record<string, string> = {
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown',
  '.png': 'image/png',
  '.css': 'text/css',
  '.js': 'text/javascript',
}

/**
 * 把 systems/ 目录映射到 Web 根路径 /systems：
 * - dev：Connect 中间件按请求读盘（改配置后浏览器刷新即生效）
 * - build：closeBundle 阶段整体拷贝到 dist/systems（preview 同样可用）
 */
function prototypeContent(root: string): Plugin {
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
        res.end(readFileSync(file))
      })
    },
    closeBundle() {
      cpSync(contentDir, resolve(root, 'dist/systems'), { recursive: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), prototypeContent(process.cwd())],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
