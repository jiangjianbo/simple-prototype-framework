/**
 * 面包屑自维护（§9.2）：状态由导航派生，组件只消费。
 */

import { reactive } from 'vue'
import type { Crumb } from './types'

export const breadcrumbState = reactive({
  trail: [] as Crumb[],
})

export function pushCrumb(crumb: Crumb) {
  const idx = breadcrumbState.trail.findIndex(c => c.pageId === crumb.pageId)
  if (idx > -1) {
    breadcrumbState.trail.splice(idx + 1)
    breadcrumbState.trail[idx] = { ...crumb }
  } else {
    breadcrumbState.trail.push({ ...crumb })
  }
}

export function resetCrumbs(crumbs: Crumb[] = []) {
  breadcrumbState.trail = crumbs.map(c => ({ ...c }))
}
