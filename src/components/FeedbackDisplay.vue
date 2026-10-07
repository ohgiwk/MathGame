<script setup lang="ts">
defineProps<{
  correct: boolean
  correctAnswer: number
}>()
</script>

<template>
  <div class="feedback-pill pop-in" :class="correct ? 'correct' : 'incorrect'">
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
  border-radius: 99px;
  border: 1px solid;
  font-weight: 800;
  white-space: nowrap;
}
.correct {
  color: #5EF0B5;
  border-color: rgba(16,200,122,0.6);
  background: rgba(16,200,122,0.14);
  box-shadow: 0 0 14px rgba(16,200,122,0.3);
}
.incorrect {
  color: #FF8AA5;
  border-color: rgba(224,48,96,0.6);
  background: rgba(224,48,96,0.14);
  box-shadow: 0 0 14px rgba(224,48,96,0.3);
}

.feedback-icon { font-size: 0.95rem; }
.feedback-label { font-size: 0.95rem; letter-spacing: 0.08em; }
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
