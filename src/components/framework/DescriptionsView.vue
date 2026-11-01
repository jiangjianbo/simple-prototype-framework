<script setup lang="ts">
/**
 * descriptions：类型感知的详情描述列表。
 * fields 来自 `@@User` 展开；value 为数据对象；mode 传播支持 readonly/preview。
 */

import { computed } from 'vue'
import type { FieldMeta, Mode } from '@/framework/types'
import FieldValue from './FieldValue.vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    fields?: FieldMeta[]
    data?: any
    value?: any
    columns?: number
    mode?: Mode
    bordered?: boolean
  }>(),
  { columns: 2, bordered: true },
)

const record = computed<Record<string, any>>(() => props.value ?? props.data ?? {})
const fieldList = computed(() => props.fields ?? [])
</script>

<template>
  <dl
    class="grid gap-x-8 gap-y-0"
    :style="{ gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` }"
  >
    <div
      v-for="f in fieldList"
      :key="f.name"
      class="flex items-start gap-3 py-2.5"
      :class="props.bordered ? 'border-b last:border-b-0' : ''"
    >
      <dt class="text-muted-foreground w-28 shrink-0 text-sm leading-6" :title="f.desc ?? f.label">
        {{ f.label }}
      </dt>
      <dd class="min-w-0 flex-1 text-sm leading-6">
        <FieldValue :meta="f" :value="record[f.name]" />
      </dd>
    </div>
  </dl>
</template>
