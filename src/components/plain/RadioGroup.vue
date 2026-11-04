<script setup lang="ts">
/** plain 套件 radio-group：原生 radio 实现（契约同 shadcn 版：modelValue + options） */

export interface RadioOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    class?: string
    modelValue?: string
    options?: RadioOption[]
    disabled?: boolean
    orientation?: 'horizontal' | 'vertical'
  }>(),
  { options: () => [], orientation: 'horizontal' },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div
    data-slot="radio-group"
    :class="[props.class, props.orientation === 'horizontal' ? 'flex flex-wrap items-center gap-4' : 'grid gap-2']"
  >
    <label
      v-for="opt in props.options"
      :key="String(opt.value)"
      class="flex cursor-pointer items-center gap-2 text-sm"
      :class="props.disabled || opt.disabled ? 'cursor-not-allowed opacity-50' : ''"
    >
      <input
        type="radio"
        class="accent-[var(--primary)]"
        :name="`pp-radio-${Math.random().toString(36).slice(2, 8)}`"
        :value="String(opt.value)"
        :checked="String(props.modelValue) === String(opt.value)"
        :disabled="props.disabled || opt.disabled"
        @change="emit('update:modelValue', String(opt.value))"
      />
      <span>{{ opt.label }}</span>
    </label>
  </div>
</template>
