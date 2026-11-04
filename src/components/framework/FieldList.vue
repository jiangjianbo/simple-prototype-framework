<script setup lang="ts">
import type { FieldMeta } from '@/framework/types'

/** `@@Xxx` 展开出的字段占位预览（在 table/form 中由对应组件接管，独立使用时展示字段清单） */
defineProps<{
  fields?: FieldMeta[]
  placeholder?: string
}>()
</script>

<template>
  <div v-if="fields?.length" class="flex flex-wrap gap-1.5">
    <span
      v-for="f in fields"
      :key="f.name"
      :title="f.desc ?? f.label"
      class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
    >
      <span class="font-medium">{{ f.label }}</span>
      <span class="text-muted-foreground font-mono">{{ f.name }}{{ f.isArray ? '[]' : '' }}</span>
    </span>
  </div>
  <span v-else class="text-muted-foreground text-sm">{{ placeholder ?? '（无字段元数据）' }}</span>
</template>
