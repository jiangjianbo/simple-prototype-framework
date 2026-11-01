<script setup lang="ts">
defineProps<{
  text?: string
  data?: any
  href?: string
}>()
</script>

<template>
  <a
    class="text-primary font-medium underline-offset-4 hover:underline cursor-pointer"
    :href="href ?? 'javascript:;'"
    @click.prevent
  >
    {{ typeof data === 'string' ? data : text }}
  </a>
</template>
