<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { MAX_LIVES } from '../types/game'
import { formatQuestion } from '../logic/questionGenerator'
import ProgressBar from './ProgressBar.vue'
import HeartDisplay from './HeartDisplay.vue'
import FeedbackDisplay from './FeedbackDisplay.vue'

const store = useGameStore()
const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')

const state = computed(() => store.gameState)
const question = computed(() => store.currentQuestion)

const progressCurrent = computed(() => {
  const s = state.value
  if (!s) return 0
  return s.currentIndex + 1
})
const progressTotal = computed(() => state.value?.questions.length ?? 1)

watch(question, (q) => {
  if (q) {
    inputValue.value = ''
    nextTick(() => inputRef.value?.focus())
  }
}, { immediate: true })

function handleSubmit() {
  const val = inputValue.value.trim()
  if (!val) return
  if (state.value?.isSubmitting) return
  store.submitAnswer(val)
  inputValue.value = ''
}
</script>

<template>
  <div v-if="state && question" class="game-root">

    <!-- Header -->
    <div class="game-header">
      <div class="header-top">
        <div class="progress-label">
          <span class="prog-cur">{{ progressCurrent }}</span>
          <span class="prog-sep"> / </span>
          <span class="prog-tot">{{ progressTotal }}</span>
          <span class="prog-word"> 問</span>
        </div>
        <HeartDisplay :lives="state.lives" />
      </div>
      <ProgressBar :current="progressCurrent" :total="progressTotal" />
      <div class="header-sub">
        正解 {{ state.correctCount }}
        <span class="sep-dot">·</span>
        残りミス {{ state.lives }} / {{ MAX_LIVES }}
      </div>
    </div>

    <!-- Question card -->
    <div class="question-area">
      <div class="question-card rpg-card fade-in-up">
        <div class="diff-badge">
          {{ state.settings.difficulty === 'easy' ? '易しい' : state.settings.difficulty === 'normal' ? '普通' : '難しい' }}
        </div>
        <div class="question-expr">{{ formatQuestion(question) }}</div>
        <div class="question-eq">= ?</div>

        <!-- Decorative gem corners -->
        <div class="gem-corner tl">◆</div>
        <div class="gem-corner tr">◆</div>
        <div class="gem-corner bl">◆</div>
        <div class="gem-corner br">◆</div>
      </div>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="tel"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="答えを入力"
        class="answer-input"
        :disabled="state.isSubmitting"
        @keydown.enter="handleSubmit"
      />
      <button
        class="btn-gem"
        :disabled="state.isSubmitting || !inputValue.trim()"
        @click="handleSubmit"
      >
        回答する
      </button>
    </div>

    <!-- Feedback overlay -->
    <Transition name="feedback">
      <FeedbackDisplay
        v-if="state.feedback"
        :correct="state.feedback.correct"
        :correct-answer="state.feedback.correctAnswer"
      />
    </Transition>
  </div>
</template>

<style scoped>
.game-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.game-header {
  padding: 0.8rem 1.2rem 0.6rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.progress-label { font-weight: 700; }
.prog-cur { font-size: 1.2rem; color: var(--gold-light); font-weight: 900; }
.prog-sep, .prog-tot { color: var(--text-sub); font-size: 0.9rem; }
.prog-word { color: var(--text-sub); font-size: 0.8rem; margin-left: 2px; }
.header-sub {
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: var(--text-sub);
  text-align: right;
}
.sep-dot { margin: 0 4px; }

/* Question */
.question-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1.2rem;
}
.question-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
  padding: 2.5rem 1.5rem 2rem;
  position: relative;
  animation: gem-pulse 3s ease infinite;
}
.diff-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-sub);
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: 2px 10px;
  margin-bottom: 1.2rem;
  text-transform: uppercase;
}
.question-expr {
  font-size: clamp(1.8rem, 9vw, 4.5rem);
  font-weight: 900;
  color: var(--text-main);
  letter-spacing: 0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  white-space: nowrap;
}
.question-eq {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--gold);
  margin-top: 0.5rem;
  filter: drop-shadow(0 0 8px rgba(201,168,54,0.4));
}

.gem-corner {
  position: absolute;
  font-size: 0.55rem;
  color: var(--gem-blue);
  opacity: 0.5;
  filter: drop-shadow(0 0 4px var(--gem-blue));
}
.tl { top: 10px; left: 12px; }
.tr { top: 10px; right: 12px; }
.bl { bottom: 10px; left: 12px; }
.br { bottom: 10px; right: 12px; }

/* Input */
.input-area {
  padding: 0 1.2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.btn-gem { font-size: 1.1rem; padding: 17px; }
</style>
