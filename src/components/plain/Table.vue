<script setup lang="ts">
/** plain 套件 table 原语容器（契约 table-raw）：div 滚动容器 + 裸 table 元素 */
</script>

<template>
  <div data-slot="table" class="relative w-full overflow-auto">
    <table class="w-full caption-bottom text-sm">
      <slot />
    </table>
  </div>
</template>
