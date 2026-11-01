<script setup lang="ts">
/**
 * 类型感知的值展示（表格单元格 / 详情描述共用）。
 * 根据 FieldMeta 决定格式：布尔 → 是/否徽章；数组 → 徽章组；
 * 引用对象 → 取 name/label/title；Date → 日期；数字 → 千分位。
 */

import { computed } from 'vue'
import type { FieldMeta } from '@/framework/types'
import { isRefType } from '@/framework/metadata'
import { formatDate, formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import ReadonlyBoolean from './ReadonlyBoolean.vue'

const props = defineProps<{
  meta?: FieldMeta | null
  value?: any
}>()

const empty = computed(() => props.value == null || props.value === '')

const isBool = computed(() => typeof props.value === 'boolean' || props.meta?.type === 'boolean')
const isNum = computed(() => props.meta?.type === 'number' && typeof props.value !== 'object')
const isDate = computed(() => props.meta?.type === 'Date')

function pickName(obj: any): string {
  if (obj == null) return ''
  if (typeof obj !== 'object') return String(obj)
  return obj.name ?? obj.label ?? obj.title ?? obj.id ?? JSON.stringify(obj)
}

const list = computed<any[]>(() => (Array.isArray(props.value) ? props.value : []))
const listIsObjects = computed(() => list.value.length > 0 && typeof list.value[0] === 'object')
</script>

<template>
  <span v-if="empty" class="text-muted-foreground/60">-</span>
  <ReadonlyBoolean v-else-if="isBool" :value="value" />
  <div v-else-if="Array.isArray(value)" class="flex flex-wrap items-center gap-1">
    <Badge v-for="(item, i) in list.slice(0, 4)" :key="i" variant="secondary">
      {{ listIsObjects ? pickName(item) : String(item) }}
    </Badge>
    <Badge v-if="list.length > 4" variant="outline">+{{ list.length - 4 }}</Badge>
  </div>
  <span v-else-if="typeof value === 'object'">{{ pickName(value) }}</span>
  <span v-else-if="isDate" class="tabular-nums">{{ formatDate(value) }}</span>
  <span v-else-if="isNum" class="tabular-nums">{{ formatNumber(value) }}</span>
  <span v-else>{{ value }}</span>
</template>
