<script setup lang="ts">
defineProps<{
  correct: boolean
  correctAnswer: number
}>()
</script>

<template>
  <div class="feedback-pill pill pop-in" :class="correct ? 'pill-success' : 'pill-danger'">
    <span class="feedback-icon">{{ correct ? '◎' : '✕' }}</span>
    <span class="feedback-label">{{ correct ? '正解！' : '不正解' }}</span>
    <span v-if="!correct" class="feedback-answer">
      正解は <span class="answer-val">{{ correctAnswer }}</span>
    </span>
  </div>
</template>

<style scoped>
.feedback-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 6px 16px;
  white-space: nowrap;
  box-shadow: 0 0 14px rgba(var(--pill-rgb), 0.3);
}

.feedback-icon {
  font-size: 0.95rem;
}
.feedback-label {
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}
.feedback-answer {
  margin-left: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-main);
}
.answer-val {
  font-size: 1.05rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
</style>
