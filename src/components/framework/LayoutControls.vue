<script setup lang="ts">
/**
 * layout-controls（契约组件，套件无关）：场景布局的切换控件簇。
 * 系统 / 套件 / 主题 / 角色四个下拉 + 标注工具（设计说明面板开关、全部标注）+ 头像；
 * 由各场景布局的 controls 槽回落渲染。
 * 全部下拉/按钮使用契约组件（随套件变形）；切套件触发整树重渲染，切主题即时生效。
 */

import { computed } from 'vue'
import { StickyNoteIcon, MessageSquarePlusIcon } from 'lucide-vue-next'
import { appState, loadSystem } from '@/framework/app-store'
import { setRole } from '@/framework/role'
import { kitState, setKit, applyTheme, THEMES } from '@/framework/kit-store'
import { annotationState, toggleNotePanel } from '@/framework/annotation-store'
import { KIT_LIST, resolveComponent } from '@/registry'

const SelectCmp = resolveComponent('select')!
const ButtonCmp = resolveComponent('button')!

const roles = computed(() => appState.menu?.roles ?? [])
const roleOptions = computed(() => roles.value.map(r => ({ label: r.label, value: r.id })))
/** 头像兜底字：当前角色首字；无角色体系时显示「管」 */
const avatarChar = computed(
  () => roles.value.find(r => r.id === appState.role)?.label?.charAt(0) || '管',
)
</script>

<template>
  <div data-slot="layout-controls" class="flex items-center gap-3">
    <component
      :is="SelectCmp"
      class="w-36"
      :model-value="appState.system"
      :options="appState.systems.map(s => ({ label: s.label, value: s.id }))"
      @update:model-value="loadSystem(String($event))"
    />
    <component
      :is="SelectCmp"
      class="w-32"
      :model-value="kitState.kit"
      :options="KIT_LIST.map(k => ({ label: k.label, value: k.id }))"
      title="套件（组件实现）"
      @update:model-value="setKit(String($event))"
    />
    <component
      :is="SelectCmp"
      class="w-24"
      :model-value="kitState.theme"
      :options="THEMES.map(t => ({ label: t.label, value: t.id }))"
      title="主题（配色）"
      @update:model-value="applyTheme(String($event))"
    />
    <template v-if="roleOptions.length">
      <div class="bg-border h-5 w-px" />
      <component
        :is="SelectCmp"
        class="w-28"
        :model-value="appState.role"
        :options="roleOptions"
        title="角色"
        @update:model-value="setRole(String($event))"
      />
    </template>
    <!-- 标注工具（§14）：设计说明面板开关 + 全部标注入口 -->
    <div class="bg-border h-5 w-px" />
    <component
      :is="ButtonCmp"
      variant="ghost"
      size="sm"
      data-slot="note-panel-toggle"
      :title="annotationState.notePanel.enabled ? '隐藏设计说明面板' : '显示设计说明面板'"
      @click="toggleNotePanel()"
    >
      <StickyNoteIcon class="size-4" />
      设计说明
    </component>
    <component
      :is="ButtonCmp"
      variant="ghost"
      size="sm"
      data-slot="annotations-open"
      title="查看全部标注"
      @click="annotationState.listOpen = true"
    >
      <MessageSquarePlusIcon class="size-4" />
      全部标注
      <span
        v-if="annotationState.items.length"
        data-slot="annotations-count"
        class="bg-primary text-primary-foreground inline-flex min-w-4 justify-center rounded-full px-1 text-[10px] leading-4 font-medium"
      >{{ annotationState.items.length }}</span>
    </component>
    <span
      data-slot="avatar-fallback"
      class="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
      :title="roles.find(r => r.id === appState.role)?.label ?? '当前用户'"
    >{{ avatarChar }}</span>
  </div>
</template>
