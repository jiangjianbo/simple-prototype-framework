<script setup lang="ts">
/**
 * tag-list（契约组件，套件无关）：胶囊标签列表 + 溢出 +N。Deckurate base/tag-list 简化版。
 * tags 支持字符串或 { label, variant } 对象；超出 limit 折叠为 +N（title 提示全部）。
 */
import { computed } from 'vue'

interface TagItem {
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
}

const props = withDefaults(
  defineProps<{ tags?: (string | TagItem)[]; limit?: number; clickable?: boolean }>(),
  { limit: 6, clickable: false },
)

const items = computed<TagItem[]>(() =>
  (props.tags ?? []).map(t => (typeof t === 'string' ? { label: t } : t)),
)
const visible = computed(() => items.value.slice(0, props.limit))
const overflow = computed(() => items.value.slice(props.limit))

const variantCls: Record<string, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-white',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400',
  outline: 'border-border text-foreground',
}
</script>

<template>
  <div data-slot="tag-list" class="inline-flex flex-wrap items-center gap-1" role="list">
    <span
      v-for="(t, i) in visible"
      :key="`${t.label}-${i}`"
      role="listitem"
      :class="[variantCls[t.variant ?? 'outline'], clickable ? 'cursor-pointer hover:opacity-80' : '']"
      class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
    >{{ t.label }}</span>
    <span
      v-if="overflow.length"
      data-slot="tag-list-overflow"
      :title="overflow.map(t => t.label).join('、')"
      class="border-border text-muted-foreground hover:bg-muted inline-flex cursor-default items-center rounded-full border px-2 py-0.5 text-xs"
    >+{{ overflow.length }}</span>
  </div>
</template>
