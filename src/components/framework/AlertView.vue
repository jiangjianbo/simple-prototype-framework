<script setup lang="ts">
import { computed, type Component } from 'vue'
import { resolveIcon } from '@/lib/icon-map'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
    title?: string
    description?: string
    icon?: string
  }>(),
  { variant: 'default' },
)

const defaultIcon: Record<string, string> = {
  default: 'info',
  info: 'info',
  success: 'shield-check',
  warning: 'triangle-alert',
  destructive: 'triangle-alert',
}

const iconCmp = computed(
  () => resolveIcon(props.icon ?? defaultIcon[props.variant]) as Component,
)
</script>

<template>
  <Alert :variant="props.variant">
    <component :is="iconCmp" />
    <AlertTitle v-if="title">{{ title }}</AlertTitle>
    <AlertDescription v-if="description">{{ description }}</AlertDescription>
    <slot />
  </Alert>
</template>
