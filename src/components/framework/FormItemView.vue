<script setup lang="ts">
/** form-item：label + 控件（default 插槽）+ 描述 */
defineProps<{
  label?: string
  desc?: string
  required?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-xs font-medium text-muted-foreground">
      {{ label }}<span v-if="required" class="text-destructive ml-0.5">*</span>
    </label>
    <slot />
    <p v-if="desc" class="text-muted-foreground text-xs">{{ desc }}</p>
  </div>
</template>
