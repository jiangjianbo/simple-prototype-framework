<script setup lang="ts">
/** chart-bar：Unovis StackedBar（多 y 键自动堆叠） */

import { computed } from 'vue'
import { VisXYContainer, VisStackedBar, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
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
  }>(),
  { height: 260, data: () => [] },
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

const xTickFormat = (i: number) => labels.value[Math.round(Number(i))] ?? ''
const yTickFormat = (v: number) => formatNumber(Math.round(v))

function tooltip(d: any): string {
  if (!d || typeof d !== 'object') return ''
  const i = (props.data ?? []).indexOf(d)
  const nameOf = (k: string) => props.series?.find(s => s.key === k)?.label ?? k
  const rows = keys.value
    .map((k, ki) => {
      const c = palette.value[ki % palette.value.length]
      return `<div style="display:flex;align-items:center;gap:6px;font-size:12px;line-height:20px;">
        <span style="width:8px;height:8px;border-radius:99px;background:${c}"></span>
        <span style="opacity:.65">${nameOf(k)}</span>
        <b style="margin-left:auto;padding-left:12px">${formatNumber(Number(d[k] ?? 0))}</b>
      </div>`
    })
    .join('')
  return `<div style="min-width:150px;background:var(--popover);border:1px solid var(--border);border-radius:10px;padding:8px 10px;color:var(--popover-foreground);box-shadow:0 4px 16px rgb(0 0 0 / .12)">
    <div style="font-size:12px;font-weight:600;margin-bottom:4px">${labels.value[i] ?? ''}</div>${rows}
  </div>`
}
</script>

<template>
  <VisXYContainer :height="props.height" :margin="{ left: 8, right: 8, top: 8 }" class="w-full">
    <VisStackedBar :x="x" :y="ys" :color="colorFn" :bar-padding="0.25" :rounded-corners="4" />
    <VisAxis type="x" :tick-format="xTickFormat" />
    <VisAxis type="y" :tick-format="yTickFormat" :grid-line="true" :num-ticks="4" />
    <VisCrosshair :template="tooltip" />
    <VisTooltip />
  </VisXYContainer>
</template>
