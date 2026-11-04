<script setup lang="ts">
/** plain 套件 select：原生 <select> 实现（契约同 shadcn 版：modelValue + options[{label,value,disabled?}]） */

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    class?: string
    modelValue?: string
    options?: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  { options: () => [] },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <select
    data-slot="select-trigger"
    :class="props.class"
    class="border-input bg-background text-foreground flex h-9 w-full min-w-0 cursor-pointer items-center border px-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
    :value="props.modelValue != null ? String(props.modelValue) : ''"
    :disabled="props.disabled"
    @change="onChange"
  >
    <option v-if="props.placeholder" value="" disabled>{{ props.placeholder }}</option>
    <option v-for="opt in props.options" :key="String(opt.value)" :value="String(opt.value)" :disabled="opt.disabled">
      {{ opt.label }}
    </option>
  </select>
</template>
