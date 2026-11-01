/**
 * jsdom 环境补丁：在测试模块加载前安装（@unovis/ts 在模块初始化时捕获 ResizeObserver）。
 */
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
