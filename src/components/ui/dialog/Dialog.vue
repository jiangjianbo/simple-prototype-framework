<script setup lang="ts">
/**
 * 对话框原语封装（reka-ui Dialog 系）：框架内部使用（标注对话框等），
 * 不注册为契约组件。open 受控；标题/描述可插槽覆盖。
 */
import type { HTMLAttributes } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { XIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  open?: boolean
  title?: string
  description?: string
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()
</script>

<template>
  <DialogRoot :open="props.open" @update:open="v => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 pp-animate-in" />
      <DialogContent
        data-slot="dialog-content"
        :class="cn(
          'pp-animate-in bg-background fixed left-1/2 top-1/2 z-50 grid max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-6 shadow-lg',
          props.class,
        )"
      >
        <div v-if="props.title || $slots.title" class="flex flex-col gap-1.5 pr-8">
          <DialogTitle class="text-lg leading-none font-semibold">
            <slot name="title">{{ props.title }}</slot>
          </DialogTitle>
          <DialogDescription v-if="props.description || $slots.description" class="text-muted-foreground text-sm">
            <slot name="description">{{ props.description }}</slot>
          </DialogDescription>
        </div>
        <slot />
        <DialogClose
          class="ring-offset-background focus:ring-ring absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
        >
          <XIcon class="size-4" />
          <span class="sr-only">关闭</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
