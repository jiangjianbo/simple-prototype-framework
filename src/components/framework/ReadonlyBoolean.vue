<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  value?: boolean | null
  data?: boolean | null
}>()

const v = () => {
  const raw = props.value ?? props.data
  return raw == null ? null : Boolean(raw)
}
</script>

<template>
  <Badge v-if="v() === true" variant="success">是</Badge>
  <Badge v-else-if="v() === false" variant="secondary">否</Badge>
  <span v-else class="text-muted-foreground">-</span>
</template>
