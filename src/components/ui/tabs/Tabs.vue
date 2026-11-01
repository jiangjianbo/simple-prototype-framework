<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string
  defaultValue?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <TabsRoot
    data-slot="tabs"
    :model-value="props.modelValue"
    :default-value="props.defaultValue"
    :class="cn('flex flex-col gap-2', props.class)"
    @update:model-value="(v: unknown) => emit('update:modelValue', String(v ?? ''))"
  >
    <slot />
  </TabsRoot>
</template>
