<script setup lang="ts">
/**
 * login-layout（场景布局）：登录 / 注册等独立入口页，一套件无关实现（经契约组件自适配套件）。
 * 插槽：brand / title / form / controls / footer
 * controls 槽留空回落契约 layout-controls（右上角）；面板用契约 card（随套件变形）。
 */
import { resolveComponent } from '@/registry'

const CardCmp = resolveComponent('card')!
const ControlsCmp = resolveComponent('layout-controls')!
</script>

<template>
  <div class="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
    <div class="absolute top-4 right-4 z-10">
      <slot name="controls">
        <component :is="ControlsCmp" />
      </slot>
    </div>

    <component :is="CardCmp" class="w-full max-w-sm">
      <div class="flex flex-col gap-5">
        <slot name="brand" />
        <slot name="title" />
        <slot name="form" />
      </div>
    </component>

    <div v-if="$slots.footer" class="absolute bottom-4 w-full text-center text-xs text-muted-foreground">
      <slot name="footer" />
    </div>
  </div>
</template>
