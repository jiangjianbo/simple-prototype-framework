<script setup lang="ts">
const props = defineProps<{
  data?: string
  src?: string
  alt?: string
  rounded?: boolean
}>()
</script>

<template>
  <img :src="props.data ?? props.src" :alt="props.alt ?? ''" :class="props.rounded ? 'rounded-lg' : ''" />
</template>
