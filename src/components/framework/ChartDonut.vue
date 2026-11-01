<script setup lang="ts">
/** chart-donut：Unovis Donut + 自绘图例（值与占比） */

import { computed } from 'vue'
import { VisSingleContainer, VisDonut } from '@unovis/vue'
import { chartPalette } from '@/lib/chart'
import { formatNumber } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    data?: any[]
    categoryKey?: string
    valueKey?: string
    height?: number
    colors?: string[]
  }>(),
  { height: 240, categoryKey: 'label', valueKey: 'value', data: () => [] },
)

const palette = computed(() => (props.colors?.length ? props.colors : chartPalette()))

const value = (d: any) => Number(d?.[props.valueKey] ?? 0)
const colorFn = (_d: any, i: number) => palette.value[i % palette.value.length]

const total = computed(() => (props.data ?? []).reduce((a, d) => a + Number(d?.[props.valueKey] ?? 0), 0))
const legend = computed(() =>
  (props.data ?? []).map((d, i) => ({
    label: String(d?.[props.categoryKey] ?? `#${i + 1}`),
    value: Number(d?.[props.valueKey] ?? 0),
    percent: total.value ? Math.round((Number(d?.[props.valueKey] ?? 0) / total.value) * 1000) / 10 : 0,
    color: palette.value[i % palette.value.length],
  })),
)
</script>

<template>
  <div class="flex items-center gap-5">
    <div class="relative" :style="{ width: `${props.height}px` }">
      <VisSingleContainer :height="props.height" :data="props.data ?? []" class="w-full">
        <VisDonut
          :value="value"
          :color="colorFn"
          :pad-angle="2"
          :corner-radius="5"
          :arc-width="22"
        />
      </VisSingleContainer>
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-muted-foreground text-[11px]">总计</span>
        <span class="text-lg font-semibold tabular-nums">{{ formatNumber(total) }}</span>
      </div>
    </div>
    <div class="min-w-0 flex-1 space-y-2">
      <div v-for="item in legend" :key="item.label" class="flex items-center gap-2 text-sm">
        <span class="size-2.5 shrink-0 rounded-sm" :style="{ background: item.color }" />
        <span class="text-muted-foreground truncate">{{ item.label }}</span>
        <span class="ml-auto font-medium tabular-nums">{{ formatNumber(item.value) }}</span>
        <span class="text-muted-foreground w-12 text-right text-xs tabular-nums">{{ item.percent }}%</span>
      </div>
    </div>
  </div>
</template>
