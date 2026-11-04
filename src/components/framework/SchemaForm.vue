<script setup lang="ts">
/**
 * schema-form（注册名 form / schema-form）：
 * fields 来自 `@@User` 等 @@ 引用展开，按「类型 × mode」决策矩阵（§7.4）
 * 逐字段选择控件：edit→input/input-number/switch/date-picker；
 * readonly→文本/是-否徽章；disabled→编辑控件 + disabled 注入。
 * 引用类型字段：edit 展示占位，readonly 展示名称/徽章（FieldValue）。
 *
 * values（外部响应式对象，如状态机 binding）优先；否则用 value 播种内部 store。
 */

import { computed, reactive, watch } from 'vue'
import type { FieldMeta, Mode } from '@/framework/types'
import { isRefType } from '@/framework/metadata'
import { defaultValueFor, resolveFieldComponent, FORM_LIKE_COMPONENTS } from '@/framework/field-mapper'
import FieldValue from './FieldValue.vue'
import FallbackDisplay from './MissingComponent.vue'
import { resolveComponent } from '@/registry'
import { cn } from '@/lib/utils'

// 表单控件经契约解析（随套件变形）；在 setup 体内解析，整树随套件切换重挂载后自动取新实现
const Input = resolveComponent('input')!
const Textarea = resolveComponent('textarea')!
const InputNumber = resolveComponent('input-number')!
const Label = resolveComponent('label')!
const Switch = resolveComponent('switch')!
const Select = resolveComponent('select')!
const RadioGroup = resolveComponent('radio-group')!
const Checkbox = resolveComponent('checkbox')!
const Slider = resolveComponent('slider')!
const DatePicker = resolveComponent('date-picker')!

interface FieldOption {
  label: string
  value: string | number
}

const props = withDefaults(
  defineProps<{
    fields?: FieldMeta[]
    /** 播种值（对象字面量或 /file.json 内联结果） */
    value?: Record<string, any> | null
    /** 外部响应式值仓库（状态机 binding），存在时直接使用 */
    values?: Record<string, any> | null
    mode?: Mode
    disabled?: boolean
    columns?: number
    /** 字段级 options 覆盖：{ 字段名: options } */
    fieldOptions?: Record<string, FieldOption[]>
  }>(),
  { columns: 2, mode: 'edit' },
)

function seed(): Record<string, any> {
  const out: Record<string, any> = {}
  for (const f of props.fields ?? []) {
    out[f.name] = props.value?.[f.name] ?? defaultValueFor(f.type, f.isArray)
  }
  return out
}

const internal = reactive<Record<string, any>>(seed())

watch(
  () => [props.fields, props.value] as const,
  () => Object.assign(internal, seed()),
  { deep: false },
)

const store = computed<Record<string, any>>(() => props.values ?? internal)

const effectiveMode = computed<Mode>(() => {
  if (props.mode) return props.mode
  return 'edit'
})

const isDisabled = (f: FieldMeta) => props.disabled || effectiveMode.value === 'disabled'

interface Plan {
  field: FieldMeta
  /** 决策矩阵选出的注册组件名 */
  comp: string
  /** 是否为展示型（FieldValue 渲染） */
  display: boolean
  options?: FieldOption[]
}

const plans = computed<Plan[]>(() =>
  (props.fields ?? []).map(f => {
    const comp = resolveFieldComponent(f.type, effectiveMode.value, { inForm: true })
    return {
      field: f,
      comp,
      display: comp === 'text' || comp === 'boolean-badge' || comp === 'link',
      options: props.fieldOptions?.[f.name],
    }
  }),
)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
}))
</script>

<template>
  <div v-if="plans.length" class="grid gap-x-8 gap-y-1" :style="gridStyle">
    <div v-for="plan in plans" :key="plan.field.name" class="flex flex-col gap-1.5 py-1.5">
      <Label class="text-muted-foreground text-xs">
        {{ plan.field.label }}
        <span v-if="plan.field.isArray" class="text-muted-foreground/60">（多值）</span>
      </Label>

      <!-- 展示型（readonly / preview 映射） -->
      <div v-if="plan.display" class="min-h-9 leading-6">
        <FieldValue :meta="plan.field" :value="store[plan.field.name]" />
      </div>

      <!-- 引用类型字段：edit/disabled 暂以占位呈现（原型阶段） -->
      <div v-else-if="isRefType(plan.field.type) || plan.field.isArray" class="min-h-9 leading-6">
        <template v-if="effectiveMode === 'edit'">
          <FallbackDisplay :message="`[${plan.field.type}${plan.field.isArray ? '[]' : ''} 引用字段 · 待绑定选项源]`" />
        </template>
        <FieldValue v-else :meta="plan.field" :value="store[plan.field.name]" />
      </div>

      <!-- 受控编辑组件 -->
      <template v-else>
        <Textarea
          v-if="plan.comp === 'textarea'"
          v-model="store[plan.field.name]"
          :disabled="isDisabled(plan.field)"
        />
        <InputNumber
          v-else-if="plan.comp === 'input-number'"
          v-model="store[plan.field.name]"
          :disabled="isDisabled(plan.field)"
        />
        <Switch
          v-else-if="plan.comp === 'switch'"
          :model-value="!!store[plan.field.name]"
          :disabled="isDisabled(plan.field)"
          @update:model-value="store[plan.field.name] = $event"
        />
        <DatePicker
          v-else-if="plan.comp === 'date-picker'"
          v-model="store[plan.field.name]"
          :disabled="isDisabled(plan.field)"
        />
        <Select
          v-else-if="plan.comp === 'select'"
          v-model="store[plan.field.name]"
          :options="plan.options ?? []"
          placeholder="请选择"
          :disabled="isDisabled(plan.field)"
        />
        <RadioGroup
          v-else-if="plan.comp === 'radio-group'"
          v-model="store[plan.field.name]"
          :options="plan.options ?? []"
          :disabled="isDisabled(plan.field)"
        />
        <Slider
          v-else-if="plan.comp === 'slider'"
          :model-value="[Number(store[plan.field.name]) || 0]"
          :disabled="isDisabled(plan.field)"
          @update:model-value="store[plan.field.name] = $event[0]"
        />
        <Checkbox
          v-else-if="plan.comp === 'checkbox'"
          :model-value="!!store[plan.field.name]"
          :disabled="isDisabled(plan.field)"
          @update:model-value="store[plan.field.name] = $event"
        />
        <Input
          v-else
          v-model="store[plan.field.name]"
          :placeholder="plan.field.desc ?? ''"
          :disabled="isDisabled(plan.field)"
        />
      </template>

      <p v-if="plan.field.desc && effectiveMode === 'edit'" class="text-muted-foreground text-xs">
        {{ plan.field.desc }}
      </p>
    </div>
  </div>
  <div v-else class="text-muted-foreground text-sm">（未提供字段元数据）</div>
  <!-- 配置中的 slot:"footer" 子节点（如操作按钮行） -->
  <div v-if="$slots.footer" class="mt-2"><slot name="footer" /></div>
</template>
