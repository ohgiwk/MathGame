<script setup lang="ts">
defineProps<{
  correct: boolean
  correctAnswer: number
}>()
</script>

<template>
  <div class="feedback-overlay" :class="correct ? 'correct' : 'incorrect'">
    <div class="feedback-content pop-in">
      <div class="feedback-icon">{{ correct ? '◎' : '✕' }}</div>
      <div class="feedback-label">{{ correct ? '正解！' : '不正解' }}</div>
      <div v-if="!correct" class="feedback-answer">
        正解は <span class="answer-val">{{ correctAnswer }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
.correct {
  background: radial-gradient(circle at center, rgba(10,190,130,0.95) 0%, rgba(4,90,70,0.97) 100%);
}
.incorrect {
  background: radial-gradient(circle at center, rgba(200,40,70,0.95) 0%, rgba(90,10,30,0.97) 100%);
}

.feedback-content {
  text-align: center;
  color: #fff;
  padding: 2rem;
}

.feedback-icon {
  font-size: 5rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 20px rgba(255,255,255,0.4));
}
.feedback-label {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.feedback-answer {
  margin-top: 0.8rem;
  font-size: 1.1rem;
  opacity: 0.9;
}
.answer-val {
  font-size: 1.8rem;
  font-weight: 900;
}
</style>
