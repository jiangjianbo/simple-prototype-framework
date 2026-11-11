<script setup lang="ts">
/**
 * 标注编辑对话框（§14）：展示仿 XPath 定位信息（可复制），输入标注文字。
 * 同一路径已有标注时进入编辑模式（回填内容、可删除）。
 */
import { ref, computed } from 'vue'
import { CopyIcon, CheckIcon } from 'lucide-vue-next'
import {
  annotationState,
  closeAnnotationDialog,
  saveDraft,
  removeAnnotation,
  copyText,
} from '@/framework/annotation-store'
import { resolveComponent } from '@/registry'
import { Dialog } from '@/components/ui/dialog'

const ButtonCmp = resolveComponent('button')!
const TextareaCmp = resolveComponent('textarea')!

const crumbs = computed(() => annotationState.draft?.segments ?? [])

function segText(seg: { name: string; id?: string; index: number }): string {
  return seg.id ? `${seg.name}(${seg.id})` : `${seg.name}#${seg.index}`
}

const copied = ref(false)
async function copyPath() {
  if (!annotationState.draft) return
  copied.value = await copyText(annotationState.draft.path)
  if (copied.value) setTimeout(() => (copied.value = false), 1500)
}

function onSave() {
  saveDraft()
}

function onRemove() {
  if (annotationState.draft?.existingId) removeAnnotation(annotationState.draft.existingId)
  closeAnnotationDialog()
}
</script>

<template>
  <Dialog
    :open="!!annotationState.draft"
    title="标注"
    description="定位信息取自页面结构（仿 XPath），可直接定位到标注处。"
    @update:open="(v: boolean) => { if (!v) closeAnnotationDialog() }"
  >
    <div v-if="annotationState.draft" data-slot="annotation-dialog" class="grid gap-4">
      <div class="grid gap-1.5">
        <div class="text-muted-foreground flex items-center text-xs">
          定位信息
          <button
            data-slot="copy-path"
            class="hover:text-foreground ml-auto inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 hover:bg-accent"
            title="复制定位路径"
            @click="copyPath"
          >
            <CheckIcon v-if="copied" class="size-3" />
            <CopyIcon v-else class="size-3" />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <div class="bg-muted rounded-md p-2.5 font-mono text-xs leading-relaxed break-all">
          <template v-for="(seg, i) in crumbs" :key="i">
            <span v-if="i" class="text-muted-foreground/50">/</span>
            <span :class="seg.kind === 'page' ? 'text-primary font-semibold' : ''">{{ segText(seg) }}</span>
          </template>
        </div>
        <div class="text-muted-foreground text-xs">
          页面：{{ annotationState.draft.pageLabel }} · 元素：{{ annotationState.draft.elementLabel }}
        </div>
      </div>
      <div class="grid gap-1.5">
        <label class="text-sm font-medium">标注内容</label>
        <component
          :is="TextareaCmp"
          v-model="annotationState.draft.text"
          data-slot="annotation-input"
          :rows="4"
          placeholder="输入标注文字，例如：这里的排序规则需要确认…"
        />
      </div>
      <div class="flex items-center gap-2">
        <component
          :is="ButtonCmp"
          v-if="annotationState.draft.existingId"
          variant="destructive"
          size="sm"
          data-slot="annotation-delete"
          @click="onRemove"
        >删除</component>
        <div class="ml-auto flex gap-2">
          <component :is="ButtonCmp" variant="outline" size="sm" @click="closeAnnotationDialog">取消</component>
          <component :is="ButtonCmp" variant="primary" size="sm" data-slot="annotation-save" @click="onSave">保存</component>
        </div>
      </div>
    </div>
  </Dialog>
</template>
