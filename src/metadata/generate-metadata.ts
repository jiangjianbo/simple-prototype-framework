// 元数据生成（§6.2）：构建期 ts-morph 扫描各系统 models 目录下的 .ts 模型，
// 提取类字段类型与 @UiOptions 装饰器参数，产出 public/metadata.json。
// （用行注释：路径通配符中的 "*/" 会提前闭合块注释）
//
// 运行：npm run gen:metadata（tsx 执行，Vite dev/build 前自动调用）
// 人写内容统一在 <root>/systems/；public/ 仅存放生成产物。

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  Project,
  Node,
  ObjectLiteralExpression,
  StringLiteral,
  NumericLiteral,
  type SourceFile,
} from 'ts-morph'

const __dirname_ = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname_, '..', '..')

const PRIMITIVES = ['string', 'number', 'boolean', 'Date', 'null', 'undefined', 'any', 'unknown', 'bigint']

interface FieldMetaOut {
  name: string
  type: string
  isArray: boolean
  label: string
  desc?: string
}

interface TypeMetaOut {
  name: string
  system: string
  fields: FieldMetaOut[]
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    experimentalDecorators: true,
    target: 99, // ES2022
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false,
  },
})

project.addSourceFilesAtPaths(resolve(projectRoot, 'systems/*/models/*.ts'))

const result: Record<string, TypeMetaOut> = {}

function readLiteral(obj: ObjectLiteralExpression, key: string): string | number | undefined {
  const prop = obj.getProperty(key)
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined
  const init = (prop as any).getInitializer()
  if (init instanceof StringLiteral) return init.getLiteralValue()
  if (init instanceof NumericLiteral) return init.getLiteralValue()
  return undefined
}

function normalizeType(raw: string, system: string): { base: string; isArray: boolean } {
  const t = raw.replace(/\s+/g, '')
  const isArray = t.endsWith('[]')
  const base = isArray ? t.slice(0, -2) : t
  if (PRIMITIVES.includes(base)) return { base, isArray }
  // 引用类型加系统前缀（避免跨系统同名冲突）
  return { base: base.includes('.') ? base : `${system}.${base}`, isArray }
}

const sources: SourceFile[] = project.getSourceFiles()
if (!sources.length) {
  console.warn('[gen:metadata] 未找到 systems/*/models/*.ts，跳过生成')
}

for (const source of sources) {
  const rel = source.getFilePath().replace(/\\/g, '/')
  const system = rel.match(/systems\/([^/]+)\/models\//)?.[1]
  if (!system) continue

  for (const cls of source.getClasses()) {
    const className = cls.getName()
    if (!className) continue
    const fields: FieldMetaOut[] = []
    for (const prop of cls.getProperties()) {
      const decorator = prop.getDecorator('UiOptions')
      const arg = decorator?.getArguments()[0]
      const ui = arg instanceof ObjectLiteralExpression ? arg : undefined

      const rawType = prop.getType().getText(prop)
      const { base, isArray } = normalizeType(rawType, system)

      fields.push({
        name: prop.getName(),
        type: base,
        isArray,
        label: String(readLiteral(ui!, 'label') ?? prop.getName()),
        ...(readLiteral(ui!, 'desc') != null ? { desc: String(readLiteral(ui!, 'desc')) } : {}),
      })
    }
    result[`${system}.${className}`] = { name: className, system, fields }
  }
}

const outPath = resolve(projectRoot, 'public/metadata.json')
// public/ 是纯生成物（已 gitignore）：全新 clone 首次生成时需自建目录
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(result, null, 2))
console.log(`[gen:metadata] 已生成 ${outPath}（${Object.keys(result).length} 个类型）`)
for (const [key, meta] of Object.entries(result)) {
  console.log(`  - ${key}: ${meta.fields.map(f => `${f.name}:${f.type}${f.isArray ? '[]' : ''}`).join(', ')}`)
}
