/**
 * 角色与菜单权限（menu.json 的 roles / items[].roles）。
 *
 * - `roles`: 角色定义数组，第一个为进入系统时的默认角色；缺省 = 该系统无角色体系。
 * - 菜单项 `roles`: 可见角色白名单；缺省 = 所有角色可见。
 * - 分组标题（无 pageId）的子项全部不可见时整组隐藏。
 * - 切换角色后当前页不可见时，自动回到第一个可见页。
 *
 * 只做菜单可见性过滤（原型演示用途）；页面内容级权限用既有 `mode: disabled/readonly` 表达。
 */

import type { MenuItem } from './types'
import { appState } from './app-store'
import { navigate } from './navigation'

function roleAllowed(item: MenuItem, role: string): boolean {
  return !item.roles?.length || item.roles.includes(role)
}

/** 按 role 递归过滤菜单树 */
export function filterMenuByRole(items: MenuItem[], role: string): MenuItem[] {
  const out: MenuItem[] = []
  for (const item of items) {
    if (!roleAllowed(item, role)) continue
    if (item.children?.length) {
      const children = filterMenuByRole(item.children, role)
      // 纯分组标题：子项全部被过滤则整组隐藏
      if (!item.pageId && !children.length) continue
      out.push(children.length ? { ...item, children } : { ...item, children: undefined })
    } else {
      out.push({ ...item })
    }
  }
  return out
}

function pageVisible(items: MenuItem[], pageId: string): boolean {
  return items.some(i => i.pageId === pageId || pageVisible(i.children ?? [], pageId))
}

function firstVisiblePageId(items: MenuItem[]): string {
  for (const i of items) {
    if (i.pageId) return i.pageId
    const nested = firstVisiblePageId(i.children ?? [])
    if (nested) return nested
  }
  return ''
}

/** 当前页在 role 下是否仍出现在菜单里 */
export function isPageAllowed(pageId: string, role = appState.role): boolean {
  return pageVisible(filterMenuByRole(appState.menu?.items ?? [], role), pageId)
}

/** 切换角色；当前页失去权限时回退到第一个可见页 */
export function setRole(roleId: string) {
  appState.role = roleId
  if (!appState.currentPageId) return
  if (!isPageAllowed(appState.currentPageId, roleId)) {
    const first = firstVisiblePageId(filterMenuByRole(appState.menu?.items ?? [], roleId))
    if (first && first !== appState.currentPageId) navigate(first)
  }
}
