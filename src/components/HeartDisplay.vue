<script setup lang="ts">
import { ref, watch } from 'vue'
import { MAX_LIVES } from '../types/game'

const props = defineProps<{ lives: number }>()

const shaking = ref(false)
watch(
  () => props.lives,
  (lives, prevLives) => {
    if (lives < prevLives) {
      shaking.value = true
      setTimeout(() => {
        shaking.value = false
      }, 400)
    }
  },
)
</script>

<template>
  <div class="hearts" :class="{ shake: shaking }">
    <span
      v-for="i in MAX_LIVES"
      :key="i"
      class="heart"
      :class="i <= props.lives ? 'heart-on' : 'heart-off'"
      >{{ i <= props.lives ? '❤' : '♡' }}</span
    >
  </div>
</template>

<style scoped>
.hearts {
  display: flex;
  gap: 4px;
  align-items: center;
}
.heart {
  font-size: 1.4rem;
  line-height: 1;
  user-select: none;
}
.heart-on {
  color: #ff3355;
  filter: drop-shadow(0 0 5px rgba(255, 50, 80, 0.7));
}
.heart-off {
  color: #2a3a55;
}
</style>
