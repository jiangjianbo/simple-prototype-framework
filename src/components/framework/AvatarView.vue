<script setup lang="ts">
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const props = defineProps<{
  data?: string
  src?: string
  fallback?: string
  alt?: string
}>()
</script>

<template>
  <Avatar class="size-9">
    <AvatarImage v-if="props.data ?? props.src" :src="props.data ?? props.src" :alt="props.alt ?? ''" />
    <AvatarFallback :text="props.fallback ?? '用户'" class="bg-primary/10 text-primary" />
  </Avatar>
</template>
