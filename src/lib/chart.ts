/** 图表调色板：读取主题 CSS 变量 --chart-1..5，带回退色 */

const FALLBACK = ['#4f46e5', '#0891b2', '#d97706', '#dc2626', '#a21caf']

export function chartPalette(count = 5): string[] {
  if (typeof document === 'undefined') return FALLBACK.slice(0, count)
  const css = getComputedStyle(document.documentElement)
  return Array.from({ length: count }, (_, i) => {
    const v = css.getPropertyValue(`--chart-${(i % 5) + 1}`).trim()
    return v || FALLBACK[i % FALLBACK.length]
  })
}
