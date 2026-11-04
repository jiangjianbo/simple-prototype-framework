/**
 * JSON DSL 核心类型定义（对应设计文档 §4）
 */

export type Mode = 'edit' | 'readonly' | 'disabled' | 'preview'

export type NodeType = 'desktop' | 'page' | 'component' | 'element'

/** 构建期由 ts-morph 提取的字段元数据 */
export interface FieldMeta {
  name: string
  /** 归一化类型：string / number / boolean / Date / back.Role（引用带系统前缀） */
  type: string
  isArray: boolean
  label: string
  desc?: string
  /** 嵌套展开标记：`@@User.roles.name` 展开的字段来自 roles 数组内部 */
  inArray?: boolean
  arraySource?: string
}

export interface TypeMeta {
  name: string
  system: string
  fields: FieldMeta[]
}

export type MetadataRegistry = Record<string, TypeMeta>

/** JSON 节点（附录 A） */
export interface Node {
  type?: NodeType
  component: string
  slot?: string
  id?: string
  data?: any
  mode?: Mode
  children?: Node[]
  '@goto'?: string
  stateMachine?: string | { scope?: string; src: string }[]
  constants?: Record<string, any>
  [key: string]: any
}

/** 角色定义（menu.json 的 roles 数组，§3 角色与菜单权限） */
export interface RoleDef {
  id: string
  label: string
  description?: string
}

export interface MenuItem {
  label: string
  pageId?: string
  icon?: string
  /** 可见角色白名单；缺省 = 所有角色可见 */
  roles?: string[]
  children?: MenuItem[]
}

export interface MenuConfig {
  title?: string
  /** 系统角色定义；缺省 = 该系统无角色体系（不显示角色切换器） */
  roles?: RoleDef[]
  items: MenuItem[]
}

/** systems/index.json 清单条目（§15：按系统声明套件与主题） */
export interface SystemEntry {
  id: string
  label: string
  /** 组件契约实现套件（src/kits/）；缺省用清单 defaultKit */
  kit?: string
  /** CSS 变量主题（src/style.css [data-theme]）；缺省用清单 defaultTheme */
  theme?: string
}

export interface SystemsManifest {
  defaultKit?: string
  defaultTheme?: string
  systems: SystemEntry[]
}

export interface Crumb {
  pageId: string
  title: string
}

/** 状态机静态解析产物（§13.7） */
export interface StateMachine {
  states: string[]
  initial: string
  trigger: {
    events: Record<string, Record<string, string[]>>
    conds: Record<string, Record<string, string>>
  }
  response: {
    actions: Record<string, Record<string, string[]>>
  }
  /** 触发区/响应区出现过的全部组件 id */
  componentIds: string[]
}

export interface SmIssue {
  level: 'error' | 'warning'
  message: string
}

/** 渲染上下文（§5.3） */
export interface RenderContext {
  system: string
  mode: Mode
  /** 祖先节点链，供 @attr 沿树向上查找 */
  scope: Node[]
  /** 当前页面的状态机引擎（页面启用状态机时存在） */
  engine?: StateMachineEngineLike | null
}

export interface StateMachineEngineLike {
  state: string
  lastError: string
  hasComponent(id: string): boolean
  binding(id: string): Record<string, any>
  onEvent(component: string, event: string): void
  /** 该组件是否在某状态中声明了此事件 */
  declaresEvent(component: string, event: string): boolean
}
