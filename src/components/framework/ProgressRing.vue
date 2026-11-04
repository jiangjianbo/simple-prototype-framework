<script setup lang="ts">
/**
 * progress-ring（契约组件，套件无关）：环形进度。Deckurate animated-circular-progress-bar 同款。
 * SVG 双圆环 + stroke-dashoffset 0.6s 过渡动画；中心百分比文本。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ value?: number; size?: number; strokeWidth?: number }>(),
  { value: 0, size: 120, strokeWidth: 8 },
)

const clamped = computed(() => Math.min(100, Math.max(0, Number(props.value) || 0)))
const r = computed(() => (props.size - props.strokeWidth) / 2)
const c = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => c.value * (1 - clamped.value / 100))
const fontSize = computed(() => Math.round(props.size * 0.2))
</script>

<template>
  <div data-slot="progress-ring" class="inline-flex items-center justify-center">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      role="progressbar"
      :aria-valuenow="clamped"
      aria-valuemin="0"
      aria-valuemax="100"
      class="text-muted-foreground"
    >
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        stroke="currentColor"
        :stroke-opacity="0.15"
        :stroke-width="strokeWidth"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        stroke="var(--primary)"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="c"
        :stroke-dashoffset="offset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
        style="transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
      />
      <text
        :x="size / 2"
        :y="size / 2"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="fontSize"
        font-weight="600"
        class="fill-foreground tabular-nums"
      >{{ Math.round(clamped) }}%</text>
    </svg>
  </div>
</template>
