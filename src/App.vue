<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { appState, boot, rootCtx } from '@/framework/app-store'
import { kitState } from '@/framework/kit-store'
import { NodeRenderer } from '@/framework/renderer'

onMounted(boot)

// 套件更换 = 组件实现全换：以 系统:套件 为 key 整树重挂载（引擎随 loadSystem 重建）
const remountKey = computed(() => `${appState.system}:${kitState.kit}`)
</script>

<template>
  <div
    v-if="appState.status === 'loading'"
    class="text-muted-foreground flex h-screen flex-col items-center justify-center gap-3"
  >
    <Loader2 class="text-primary size-8 animate-spin" />
    <span class="text-sm">正在加载原型系统…</span>
  </div>

  <div v-else-if="appState.status === 'error'" class="flex h-screen items-center justify-center p-6">
    <div class="max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h1 class="text-destructive mb-2 text-lg font-semibold">原型加载失败</h1>
      <p class="text-muted-foreground font-mono text-sm break-all">{{ appState.error }}</p>
    </div>
  </div>

  <NodeRenderer v-else-if="appState.desktop" :key="remountKey" :node="appState.desktop" :ctx="rootCtx" />
</template>
