<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  total: number
}>()

const widthPercent = computed(() =>
  props.total > 0 ? Math.min((props.current / props.total) * 100, 100) : 0
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
  background: rgba(255,255,255,0.08);
  border-radius: 99px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #3B5CF0 0%, #9B5BF0 100%);
  box-shadow: 0 0 8px rgba(76,124,255,0.6);
  transition: width 0.35s ease;
}
</style>
