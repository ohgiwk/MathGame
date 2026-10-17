<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  total: number
}>()

const widthPercent = computed(() =>
  props.total > 0 ? Math.min((props.current / props.total) * 100, 100) : 0,
)
</script>

<template>
  <div class="prog-track">
    <div class="prog-fill" :style="{ width: widthPercent + '%' }" />
  </div>
</template>

<style scoped>
.prog-track {
  width: 100%;
  height: 6px;
  background: rgba(var(--wash-rgb), 0.08);
  border-radius: 99px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--progress-end) 100%);
  box-shadow: 0 0 8px rgba(var(--blue-rgb), 0.6);
  transition: width 0.35s ease;
}
:root[data-theme='light'] .prog-fill {
  box-shadow: none;
}
</style>
