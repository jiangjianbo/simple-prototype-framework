<script setup lang="ts">
/** plain 套件 page-view（契约同 shadcn 版 page-view/page-default）：状态机告警 + 页头 + 默认插槽 */

import { computed, watch } from 'vue'
import { currentPageEngine } from '@/framework/page-engine'
import AlertBox from './AlertBox.vue'
import { AlertTitle, AlertDescription } from './primitives'

const props = defineProps<{
  title?: string
  description?: string
}>()

// 页面状态机问题（§13.8 静态检查 + 运行时歧义错误）
const smErrors = computed(() => {
  const eng = currentPageEngine.value
  if (!eng) return []
  const errs = eng.issues.filter(i => i.level === 'error').map(i => i.message)
  if (eng.lastError) errs.push(eng.lastError)
  return errs
})
const smWarnings = computed(() => currentPageEngine.value?.issues.filter(i => i.level === 'warning').map(i => i.message) ?? [])

watch(
  () => props.title,
  t => {
    if (t) document.title = `${t} · 原型系统`
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-5">
    <AlertBox v-for="(e, i) in smErrors" :key="`e${i}`" variant="destructive">
      <AlertTitle>状态机错误</AlertTitle>
      <AlertDescription>{{ e }}</AlertDescription>
    </AlertBox>
    <AlertBox v-for="(w, i) in smWarnings" :key="`w${i}`" variant="warning">
      <AlertTitle>状态机警告</AlertTitle>
      <AlertDescription>{{ w }}</AlertDescription>
    </AlertBox>

    <header v-if="title || description" class="space-y-1 border-b pb-3">
      <h1 class="text-xl font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-muted-foreground text-sm">{{ description }}</p>
    </header>

    <slot />
  </div>
</template>
