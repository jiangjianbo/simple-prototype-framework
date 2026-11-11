/**
 * jsdom 环境补丁：在测试模块加载前安装（@unovis/ts 在模块初始化时捕获 ResizeObserver）。
 */
import { beforeEach } from 'vitest'

// app-store 现在会把 系统/页面/角色 写进 URL hash（刷新保位）；同一测试文件内
// 多次挂载 App 时，上次遗留的 hash 会被 boot() 当作恢复目标——每个用例前清掉，
// 让「新挂载 = 默认首系统首页面」的既有断言语义保持不变。
beforeEach(() => {
  history.replaceState(null, '', location.pathname + location.search)
})

class ROStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver ?? ROStub
;(globalThis as any).matchMedia ??= (() => ({
  matches: false, media: '',
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {},
})) as any

const proto = (globalThis as any).SVGElement?.prototype
if (proto) {
  if (!proto.getComputedTextLength) proto.getComputedTextLength = () => 10
  if (!proto.getBBox) proto.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 })
}
