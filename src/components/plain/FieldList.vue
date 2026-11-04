<script setup lang="ts">
/** plain 套件 field-list：直角字段清单芯片（契约同 shadcn 版 field-list） */

import type { FieldMeta } from '@/framework/types'

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
      class="inline-flex items-center gap-1 border bg-muted/50 px-2 py-0.5 text-xs"
    >
      <span class="font-medium">{{ f.label }}</span>
      <span class="text-muted-foreground font-mono">{{ f.name }}{{ f.isArray ? '[]' : '' }}</span>
    </span>
  </div>
  <span v-else class="text-muted-foreground text-sm">{{ placeholder ?? '（无字段元数据）' }}</span>
</template>
