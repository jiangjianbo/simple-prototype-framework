<script setup lang="ts">
/**
 * toggle-group（契约组件，套件无关）：分段切换控件。Deckurate base/toggle-group 同款。
 * 外框包裹 + 选中项填 primary；v-model 绑定当前值。
 */
export interface ToggleOption {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{ options?: ToggleOption[]; modelValue?: string }>(),
  { options: () => [] },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div
    data-slot="toggle-group"
    class="border-border bg-card inline-flex items-center rounded-lg border p-0.5"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :aria-pressed="modelValue === opt.value"
      class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      :class="
        modelValue === opt.value
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-foreground hover:bg-muted'
      "
      @click="emit('update:modelValue', opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>
