<script setup lang="ts">
/**
 * kbd（契约组件，套件无关）：键盘按键帽。Deckurate base/kbd 同款视觉。
 * 灰底 + 细边框 + 等宽字 + 最小宽度，主题变量驱动。
 */
withDefaults(defineProps<{ text?: string }>(), {})
</script>

<template>
  <kbd
    data-slot="kbd"
    class="border-border bg-muted text-muted-foreground inline-flex min-w-6 items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-xs shadow-sm"
  ><slot>{{ text }}</slot></kbd>
</template>
