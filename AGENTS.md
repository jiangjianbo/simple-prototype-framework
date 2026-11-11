# AGENTS.md

本文件每行都会进入每次 AI 会话，请保持精炼；新增内容前先删掉过时内容。详细规范放 doc/（渐进披露），这里只放指针。

## 项目是什么

JSON 驱动原型系统：页面用 JSON 配置描述（契约名 + 数据引用），渲染引擎递归实例化为 Vue 组件。用于快速产出高保真业务原型，不是生产框架。

技术栈：Vue 3.5 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4（`@custom-variant` dark）+ reka-ui（shadcn-vue 风格）+ TanStack Table v8 + Unovis 1.6（图表）+ Vitest 5（jsdom）。包管理 npm。

三份必读文档（按需查阅，不要背）：

| 文档 | 何时读 |
|---|---|
| doc/组件规范.md | 加/改组件、加套件或主题、写契约名时（契约总目录 §3 是权威） |
| doc/原型编写操作手册.md | 写/改 systems/ 下任何 JSON 配置时 |
| doc/原型系统设计文档.md | 改渲染引擎、状态机、导航等框架层时 |

## 常用命令

```bash
npx vitest run            # 全量测试（约 60-90s，63 条，12 个文件）
npx vitest run tests/xxx.test.ts   # 单文件
npx vue-tsc --noEmit      # 类型检查（提交前必跑）
npm run dev               # 元数据生成 + vite 开发服务器（改 systems/ 自动整页刷新，URL hash 保位）
npm run build             # 元数据生成 + vite build + 静态单文件构建到 dist/<系统id>/index.html
```

验证纪律：改完代码必跑 typecheck + 全量测试；涉及渲染效果的改动，`npm run build` 后用浏览器实测（`cd dist && python3 -m http.server 4173`，用 DOM 断言/computed style 验证，不要只看截图）。

## 架构速览

- **契约注册表** `src/registry.ts`：契约名（kebab-case 语义名）→ 当前套件实现。`resolveComponent` = 别名归一 → 当前套件 → shadcn 兜底；组件代码一律走契约解析，禁止硬编码具体套件组件。
- **套件（Kit）**：`src/kits/shadcn.ts`（默认+兜底，全量）、`src/kits/plain.ts`（极简，部分覆盖）。套件可只实现想覆盖的契约名，未覆盖的回落 shadcn；继承的复合件（schema-form/table/tabs）内部经契约解析取原语，自动随套件变形。新增套件步骤见组件规范 §7。
- **主题（Theme）**：CSS 变量（`src/style.css`），与套件正交。dark 用 `html.dark` class，其余用 `data-theme` 属性。
- **场景布局（Scene Layout）**：每个界面的最底层布局（`app-layout` 主应用 / `login-layout` 登录 / `screen-layout` 大屏），统一 `controls` 槽承载切换控件簇，留空回落契约组件 `layout-controls`。
- **目录**：`src/framework/`（引擎 + 复合件 + shadcn 布局）、`src/components/ui/`（reka-ui 原语）、`src/components/plain/`（plain 原语）、`systems/<id>/`（模型 models/、配置 menu/page.json、数据 data/、状态机与拆分页面 pages/）。页面节点分层：desktop → page → component → element。

## 工作原则

### Bug 处理流程

1. **先写复现测试，再排错。** 任何 bug 先在 tests/ 写一条失败的单测复现它（挂载真实 App.vue + jsdom 的模式见现有测试），确认它红，再动手修；修复即转绿。禁止不写复现测试直接"顺手改掉"。
2. **一次修复未成功 → 进入分解模式。** 停止在原层面反复试错：把出问题的功能拆成更细的可测单元，为每层写针对性单测（底层工具函数 → 组件行为 → 集成流程），先修细节层、逐层转绿，最后回到原回归测试收口。禁止在同一集成断言上连试三种改法。

### 不确定就问

关键问题不清晰时（需求目标二义、方案之间不可逆且影响面大、用户口头描述与代码/文档矛盾、涉及删除或覆盖既有工作），**整理成具体问题直接询问用户，不要猜**。可以猜的只有：命名措辞、内部实现细节这类低成本可改的东西；猜了也要在回复中说明假设。

### 原型设计原则：以数据结构为核心驱动

1. **页面定义尽量消费 models/ 中的类。** 字段列表、表单、表格列一律优先 `@@类名` / `@@类.字段` 引用（经 ts-morph 元数据展开 label/类型/格式化），而不是在 page.json 里散写重复的 label/value 结构。新页面需要新字段时先问：能否扩展现有模型类？只有真正独立的实体才建新类。
2. **数据结构尽量少。** 图表、报表同样要做概念模型归纳，把它们压缩成少数通用形状：
   - 时间序列：`[{ <时间键>, <序列名>: number, ... }]`（趋势/走势共用）
   - 分类计数：`[{ label, value }]`（分布/占比/排名共用）
   - 分组对比：`[{ group, <序列名>: number, ... }]`（多维对比共用）
   新报表先映射到这三个形状之一；确需第四种形状时，先论证它无法用现有形状表达。
3. 好例子：`systems/back/` —— User/Order/Setting 类被表格、表单、详情页多处以 `@@` 复用；risk-trend.json / alert-types.json 各自只是一个通用形状。坏例子：为每张图表发明一套专属字段名、在 page.json 里手写与模型类重复的字段数组。

## 边界

✅ **Always**

- 文件改名用 `git mv`（保留历史）；文档、注释、commit message 用中文
- 提交前：`npx vue-tsc --noEmit` + `npx vitest run` 全绿
- 组件/契约变更同步 doc/组件规范.md；配置写法变更同步操作手册
- 套件改动两个套件都要顾及（plain 部分覆盖可以回落，但要确认回落后的语义正确）
- 测试挂载用 `mount(App.vue) + fetch stub 读真实 systems/ 配置` 的既有模式（tests/setup.ts、各 *.test.ts）

⚠️ **Ask first（先问再做）**

- 新增契约名、新套件、新主题；修改 doc/组件规范.md 的契约定义
- 新增 npm 依赖；新增 systems/ 目录（新系统）
- 修改渲染引擎核心（renderer / resolver / 状态机求值）

🚫 **Never**

- 删除或改写 `COMPONENT_ALIASES` 中的别名（旧配置永久兼容的承诺）
- 手改生成物：`public/metadata.json`（`npm run gen:metadata` 扫描 models/ 重新生成）、`dist/`（构建产物）
- 改存量 systems/ JSON 中正常工作的旧契约名（别名会解析；仅新增配置用规范名）
- 提交密钥/令牌；绕过失败的测试（删测试、skip、改断言迁就实现）
- 在组件里硬编码另一套件的组件、用具体颜色值替代主题 CSS 变量
