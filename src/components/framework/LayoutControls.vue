<script setup lang="ts">
/**
 * layout-controls（契约组件，套件无关）：场景布局的切换控件簇。
 * 系统 / 套件 / 主题 / 角色四个下拉 + 头像；由各场景布局的 controls 槽回落渲染。
 * 全部下拉使用契约组件 `select`（随套件变形）；切套件触发整树重渲染，切主题即时生效。
 */

import { computed } from 'vue'
import { appState, loadSystem } from '@/framework/app-store'
import { setRole } from '@/framework/role'
import { kitState, setKit, applyTheme, THEMES } from '@/framework/kit-store'
import { KIT_LIST, resolveComponent } from '@/registry'

const SelectCmp = resolveComponent('select')!

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
    <span
      data-slot="avatar-fallback"
      class="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
      :title="roles.find(r => r.id === appState.role)?.label ?? '当前用户'"
    >{{ avatarChar }}</span>
  </div>
</template>
