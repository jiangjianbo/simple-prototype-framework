# simple-prototype-framework

JSON 驱动、可嵌套、类型感知的静态前端原型系统。用一份 JSON 描述桌面、页面、组件与交互，浏览器端渲染引擎负责加载、渲染、导航与状态机流转 —— 不写业务前端代码，只写配置。

> **写原型看这里：[doc/原型编写操作手册.md](doc/原型编写操作手册.md)** —— 目录布局、全部组件属性、引用语法、状态机 DSL、常用配方与排错速查。

技术栈：**Vue 3 + TypeScript + Tailwind CSS v4 + 手写 shadcn-vue 风格组件**；图表基于 **Unovis**（shadcn-vue charts 同源底层）；复杂表格的分组聚合基于 **TanStack Table** 按需启用特性。

## 快速开始

```bash
npm install
npm run dev        # 先生成 metadata.json，再启动 vite（默认 http://localhost:5173）
npm run build      # 生产构建（dist/）
npm run typecheck  # vue-tsc 全量类型检查
npx vitest run     # 进程内回归测试（jsdom 挂载真实 App，fetch 读取 systems/ 真实配置）
```

## 目录约定：人写的 vs 生成的

**人写内容只有一个入口：`systems/`**（目录路径与运行时 URL 一一对应，`systems/back/...` ⇔ `/systems/back/...`）。

```
systems/                  ← 全部人写内容（改原型只来这里）
  index.json              #   系统清单（多系统切换器数据源）
  back/                   #   示例系统一：数据安全大脑（后台）
    models/*.ts           #     类型模型（User/Order/Role/Setting/Auditor）
    back.menu.json        #     菜单配置
    back.page.json        #     页面配置（desktop 节点）
    pages/*.sm.md         #     页面状态机（=== 分区 DSL）
    data/*.json           #     mock 数据
    assets/*              #     静态资源（@/ 引用）
  userfront/              #   示例系统二：用户中心（前台）
public/                   ← 纯生成产物（metadata.json），整目录可随时删除重建
src/                      ← 框架引擎（一次性写好，写原型时不用动）
tests/                    ← 回归测试（jsdom 挂载真实 App）
doc/                      ← 设计文档 + 原型编写操作手册
```

dev 由 vite 插件把 `systems/` 映射到 `/systems`（按请求读盘，改完刷新即生效）；build 时自动拷贝进 `dist/systems`。

## 快速开始之后的实现结构

```
src/
  framework/
    renderer.ts                    # 核心渲染器：节点 → VNode，插槽分组、引用解析
    navigation.ts                  # 导航：page→page 激活切换；非 page 克隆替换
    app-store.ts                   # 全局状态 + 系统加载（§9.1 / §9.4）
    breadcrumb-store.ts            # 面包屑（自动派生 + 截断语义）
    page-engine.ts                 # 页面状态机装配（scope 播种、引擎缓存）
    state-machine/{parser,engine}.ts  # 状态机 DSL 解析与运行时
    resolver.ts                    # /file.json 内联、@@Type、@attr 引用
    metadata.ts                    # 类型元数据查询与字段下钻
    field-mapper.ts                # 类型 × mode 决策矩阵（string→input 等）
  components/
    framework/                     # 30+ 配置驱动业务组件（table/chart/form/stat-card…）
    ui/                            # shadcn-vue 风格基础组件包
  metadata/generate-metadata.ts    # ts-morph 生成器（模型 TS → metadata.json）
  registry.ts                      # 组件名 → 实现注册表
```

## 核心概念

### 四级节点模型

`desktop → page → component → element`。缺省 `type` 视为 component；显式 `"type": "element"` 才是叶子（不递归 children）。page 挂在 desktop 树上，由菜单（`menu.json`）驱动激活。

### 导航语义（§9.3）

- **page → page**：纯激活实例切换（`currentPageId` / `currentPageNode`），无树变更。
- **page → 非 page 目标**（component 等）：覆盖式 —— 克隆目标节点放置到原 page 位置，目标原件保留原位。
- 面包屑自动派生：导航入栈、回跳截断；`@goto` 与菜单点击走同一 `navigate()`。

### 引用体系

- `/file.json` —— 文件引用，加载期内联（`data` / `rows` / `value` / `items` / `options` 属性）。
- `@@Type[.path]` —— 类型引用，从 metadata.json 展开字段元数据（label、类型、数组标记），驱动表格列与表单字段。
- `@attr` —— 属性引用，沿节点祖先链查找。

### 类型感知

`gen:metadata` 用 ts-morph 扫描 `models/*.ts` 生成字段元数据；表格单元格（布尔→是/否徽章、数组→徽章组、日期→格式化、数字→千分位）与表单控件（决策矩阵：string→input、number→input-number、boolean→switch、Date→date-picker）都由元数据决定。

### 页面状态机（§13）

`=== STATE ===` 分区 DSL（`.sm.md`）：列头 = 目标状态，事件单元 = `条件 ? 目标 : 兜底`，响应区 = 对组件绑定（`readOnly/enabled/visible/text/value`）的赋值语句。示例见 `systems/back/pages/user-info.sm.md`（浏览 → 编辑 → 提交审核）。

## 多系统

`systems/index.json` 声明系统清单；顶栏切换器调用 `loadSystem(id)` 完整重载（销毁状态机引擎 → 拉取 menu/page 配置 → 预处理内联 → 重建树索引 → 定位首页）。页面配置支持两种形态：`{ "desktop": {...} }` 包装式（back）或根节点即 desktop 节点（userfront）。

## 测试

vitest + jsdom 进程内挂载真实 `App.vue`，`fetch` stub 直接读取 `systems/` 下真实配置与数据，覆盖：

1. 菜单往返导航不冻结（回归：TanStack state getter 必须返回稳定引用，否则行模型无限重算饿死调度器）；
2. 面包屑随导航增长并可回跳；
3. 状态机全流程（浏览禁用 → 编辑放开 → 提交审核回禁用）；
4. Unovis 图表 SVG path 绘制、分组表格 Σ 聚合 / 搜索过滤 / 收起展开 / 分页；
5. 用户详情（descriptions + disabled 表单 + `@goto` 返回）、系统设置（fieldOptions 下拉 + switch）；
6. back ↔ userfront 多系统切换，页面与菜单随系统重建。

## 设计约束与已知边界

- 原型阶段状态机条件/响应使用 `with(scope) + new Function` 求值，生产环境应替换为 AST 求值器。
- 全局 `app.config.errorHandler` 兜底：生命周期/调度回调异常只记录不上抛，防止击穿 Vue 调度器导致整站静默冻结。
- 图表为 Unovis 基础封装（area/line/bar/donut）；未来需要高级图表时再评估 TanStack Charts。
- 构建产物单 chunk 约 625 kB（未做代码分割），原型阶段可接受。
