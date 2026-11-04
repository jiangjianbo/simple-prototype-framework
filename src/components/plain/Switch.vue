<script setup lang="ts">
/** plain 套件 switch：原生 checkbox 实现的方形开关（契约同 shadcn 版：modelValue: boolean） */

const props = defineProps<{
  class?: string
  modelValue?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    data-slot="switch"
    :class="props.class"
    class="border-input bg-background hover:bg-muted inline-flex h-5 w-9 items-center border p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :aria-checked="props.modelValue"
    :disabled="props.disabled"
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <span
      class="h-3.5 w-3.5 transition-transform"
      :class="props.modelValue ? 'translate-x-4 bg-primary' : 'translate-x-0 bg-foreground'"
    />
  </button>
</template>
