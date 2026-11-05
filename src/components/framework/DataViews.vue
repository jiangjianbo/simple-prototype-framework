<script setup lang="ts">
/**
 * data-views（契约组件，套件无关）：多视图切换容器。
 * 同一区域的多份呈现切换（列表 ↔ 画廊、卡片 ↔ 时间线…）——每个视图是
 * 一个具名插槽（slot = 视图 id），容器自带右上角分段切换器并持有当前视图状态。
 * props.views: [{ id, label }]；props.default 缺省取第一个视图。
 */
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'

export interface DataViewOption {
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{
    views: DataViewOption[]
    /** 切换器左侧标题（如数据量说明） */
    title?: string
    default?: string
  }>(),
  {},
)

const active = ref(props.default ?? props.views[0]?.id ?? '')

const current = computed(() => props.views.find(v => v.id === active.value))
</script>

<template>
  <div data-slot="data-views" class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span v-if="props.title" class="text-sm font-medium">{{ props.title }}</span>
      <div
        data-slot="data-views-toggle"
        class="border-border bg-muted/50 flex items-center gap-0.5 rounded-lg border p-0.5"
      >
        <button
          v-for="v in props.views"
          :key="v.id"
          :class="cn(
            'cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors',
            active === v.id
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )"
          @click="active = v.id"
        >{{ v.label }}</button>
      </div>
    </div>
    <!-- 当前视图内容：视图子节点按 slot = 视图 id 投递（渲染器具名插槽分组） -->
    <div v-if="current" :data-view="current.id">
      <slot :name="current.id" />
    </div>
  </div>
</template>
