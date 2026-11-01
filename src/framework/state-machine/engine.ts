/**
 * 状态机运行时引擎（§13.5 / §13.7）
 *
 * - scope：组件 id → 响应式绑定对象（含控制属性 readOnly/enabled/visible/text/value
 *   与业务字段平铺，如 userInfo.lock）。$xxx 系统常量与 $state 也注入 scope。
 * - 求值：`with(scope)` + new Function（原型阶段可用，生产环境应替换为 AST 求值器）。
 * - 事件驱动转移：候选状态 = 声明了该事件的状态；条件全过且唯一才转移；
 *   0 个忽略，多个视为定义歧义（记录错误，不转移）。
 * - 幂等转移：目标态与当前态相同时，若响应区非空则重新执行（允许重置语义）。
 */

import { reactive } from 'vue'
import type { SmIssue, StateMachine } from '../types'
import type { StateMachineEngineLike } from '../types'

export interface PageEngine extends StateMachineEngineLike {
  issues: SmIssue[]
  evalCond(expr: string): boolean
  applyResponse(state: string): void
  dispose(): void
}

export function createBinding(seed: Record<string, any>): Record<string, any> {
  const control: Record<string, any> = {
    visible: true,
    enabled: true,
    readOnly: false,
    text: undefined,
    value: '',
  }
  const b: Record<string, any> = reactive({ ...control, ...seed })
  const initial = { ...seed }
  b.__initial = initial
  b.reset = () => {
    // 恢复播种值（控制属性除外）
    for (const k of Object.keys(initial)) b[k] = initial[k]
  }
  return b
}

export function createPageEngine(sm: StateMachine, scope: Record<string, any>): PageEngine {
  const engine: PageEngine = {
    state: sm.initial,
    lastError: '',
    issues: [],
    hasComponent(id: string) {
      return id in scope
    },
    binding(id: string) {
      return scope[id]
    },
    declaresEvent(component: string, event: string) {
      return sm.states.some(s => sm.trigger.events[s]?.[component]?.includes(event))
    },
    onEvent(component: string, event: string) {
      const candidates = sm.states.filter(s =>
        sm.trigger.events[s]?.[component]?.includes(event),
      )
      if (candidates.length === 0) return
      const matched = candidates.filter(s => {
        const cond = sm.trigger.conds[s]?.[component]
        if (!cond) return true
        return engine.evalCond(cond)
      })
      if (matched.length > 1) {
        engine.lastError = `事件 ${component}@${event} 匹配多个状态: ${matched.join(', ')}（状态机定义存在歧义）`
        console.error(`[state-machine] ${engine.lastError}`)
        return
      }
      if (matched.length === 1) {
        const target = matched[0]
        engine.state = target
        scope['$state'] = target
        engine.applyResponse(target)
      }
    },
    evalCond(expr: string): boolean {
      try {
        return !!new Function('scope', `with(scope){ return (${expr}) }`)(scope)
      } catch (e) {
        console.warn(`[state-machine] 条件求值失败: ${expr}`, e)
        return false
      }
    },
    applyResponse(state: string) {
      const actions = sm.response.actions[state] ?? {}
      for (const stmts of Object.values(actions)) {
        for (const stmt of stmts) {
          try {
            new Function('scope', `with(scope){ ${stmt} }`)(scope)
          } catch (e) {
            console.warn(`[state-machine] 响应执行失败: ${stmt}`, e)
          }
        }
      }
    },
    dispose() { /* 预留 */ },
  }

  scope['$state'] = engine.state
  // 进入初始状态：执行初始响应（§13.9 执行过程第 1 步）
  engine.applyResponse(engine.state)
  return engine
}
