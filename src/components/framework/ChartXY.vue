<script setup lang="ts">
/**
 * chart-area / chart-line 的公共 XY 实现（Unovis，shadcn-vue charts 同源底层）。
 * x 轴按索引取刻度（支持字符串类别与日期），y 支持多序列。
 */

import { computed } from 'vue'
import { VisXYContainer, VisArea, VisLine, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import { chartPalette } from '@/lib/chart'
import { formatNumber } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    data?: any[]
    xKey?: string
    yKeys?: string | string[]
    /** JSON schema 便捷形式：[{ key, label }]，与 yKeys 二选一 */
    series?: { key: string; label?: string }[]
    height?: number
    colors?: string[]
    variant?: 'area' | 'line'
    areaOpacity?: number
    yName?: string
  }>(),
  { height: 260, variant: 'area', areaOpacity: 0.16, data: () => [] },
)

const keys = computed(() => {
  if (props.series?.length) return props.series.map(s => s.key)
  if (Array.isArray(props.yKeys)) return props.yKeys
  return props.yKeys ? [props.yKeys] : []
})
const palette = computed(() => (props.colors?.length ? props.colors : chartPalette()))
const labels = computed(() => (props.data ?? []).map(d => String(d?.[props.xKey ?? ''] ?? '')))

const x = (_d: any, i: number) => i
const ys = computed(() => keys.value.map(k => (d: any) => Number(d?.[k] ?? 0)))
const colorFn = (_d: any, k: number) => palette.value[k % palette.value.length]

const xTickFormat = (i: number) => {
  const step = Math.max(1, Math.ceil(labels.value.length / 7))
  const idx = Math.round(Number(i))
  return idx % step === 0 ? (labels.value[idx] ?? '') : ''
}
const yTickFormat = (v: number) => formatNumber(Math.round(v * 100) / 100)

function tooltip(d: any): string {
  if (!d || typeof d !== 'object') return ''
  const i = (props.data ?? []).indexOf(d)
  const title = labels.value[i] ?? ''
  const nameOf = (k: string) => props.series?.find(s => s.key === k)?.label ?? k
  const rows = keys.value
    .map((k, ki) => {
      const c = palette.value[ki % palette.value.length]
      return `<div style="display:flex;align-items:center;gap:6px;font-size:12px;line-height:20px;">
        <span style="width:8px;height:8px;border-radius:99px;background:${c}"></span>
        <span style="color:inherit;opacity:.65">${nameOf(k)}</span>
        <b style="margin-left:auto;padding-left:12px">${formatNumber(Number(d[k] ?? 0))}</b>
      </div>`
    })
    .join('')
  return `<div style="min-width:150px;background:${'var(--popover)'};border:1px solid var(--border);border-radius:10px;padding:8px 10px;color:var(--popover-foreground);box-shadow:0 4px 16px rgb(0 0 0 / .12)">
    <div style="font-size:12px;font-weight:600;margin-bottom:4px">${title}</div>${rows}
  </div>`
}
</script>

<template>
  <VisXYContainer :height="props.height" :margin="{ left: 8, right: 8, top: 8 }" class="w-full">
    <template v-if="props.variant === 'area'">
      <VisArea :x="x" :y="ys" :color="colorFn" :opacity="props.areaOpacity" curve-type="monotoneX" />
      <VisLine :x="x" :y="ys" :color="colorFn" :line-width="2" curve-type="monotoneX" />
    </template>
    <VisLine v-else :x="x" :y="ys" :color="colorFn" :line-width="2" curve-type="monotoneX" />
    <VisAxis type="x" :tick-format="xTickFormat" :num-ticks="7" />
    <VisAxis type="y" :tick-format="yTickFormat" :grid-line="true" :num-ticks="4" />
    <VisCrosshair :template="tooltip" />
    <VisTooltip />
  </VisXYContainer>
</template>
