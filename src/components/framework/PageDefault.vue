<script setup lang="ts">
import { computed, watch } from 'vue'
import { currentPageEngine } from '@/framework/page-engine'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TriangleAlert, XCircle } from 'lucide-vue-next'

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
    <Alert v-for="(e, i) in smErrors" :key="`e${i}`" variant="destructive">
      <XCircle />
      <AlertTitle>状态机错误</AlertTitle>
      <AlertDescription>{{ e }}</AlertDescription>
    </Alert>
    <Alert v-for="(w, i) in smWarnings" :key="`w${i}`" variant="warning">
      <TriangleAlert />
      <AlertTitle>状态机警告</AlertTitle>
      <AlertDescription>{{ w }}</AlertDescription>
    </Alert>

    <header v-if="title || description" class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-muted-foreground text-sm">{{ description }}</p>
    </header>

    <slot />
  </div>
</template>
