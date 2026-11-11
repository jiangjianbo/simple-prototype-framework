import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { prototypeContent } from './scripts/vite-prototype'

// https://vite.dev/config/
export default defineConfig({
  // 相对 base：dist/index.html 与各 dist/<系统>/index.html 均可直接 file:// 打开
  base: './',
  plugins: [vue(), tailwindcss(), prototypeContent(process.cwd())],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
