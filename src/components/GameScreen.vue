<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { MAX_LIVES } from '../types/game'
import { formatQuestion } from '../logic/questionGenerator'
import { DIFFICULTY_LABELS } from '../logic/labels'
import ProgressBar from './ProgressBar.vue'
import HeartDisplay from './HeartDisplay.vue'
import FeedbackDisplay from './FeedbackDisplay.vue'
import NumberPad from './NumberPad.vue'
import QuitDialog from './QuitDialog.vue'

const store = useGameStore()
const inputValue = ref('')
const showQuitDialog = ref(false)

const state = computed(() => store.gameState)
const question = computed(() => store.currentQuestion)

const progressCurrent = computed(() => {
  const s = state.value
  if (!s) return 0
  return s.currentIndex + 1
})
const progressTotal = computed(() => state.value?.questions.length ?? 1)

const answerLength = computed(() => String(question.value?.answer ?? '').length)
const padDisabled = computed(() => !!state.value?.isSubmitting || showQuitDialog.value)

watch(
  question,
  () => {
    inputValue.value = ''
  },
  { immediate: true },
)

// The answer is confirmed automatically once as many digits as the answer has are entered
function pressDigit(digit: string) {
  if (padDisabled.value) return
  if (inputValue.value.length >= answerLength.value) return
  inputValue.value += digit
  if (inputValue.value.length >= answerLength.value) {
    store.submitAnswer(inputValue.value)
  }
}

function pressDelete() {
  if (padDisabled.value) return
  inputValue.value = inputValue.value.slice(0, -1)
}

function confirmQuit() {
  showQuitDialog.value = false
  store.resetGame()
}
</script>

<template>
  <div v-if="state && question" class="game-root">
    <!-- Header -->
    <div class="game-header">
      <div class="header-top">
        <div class="header-left">
          <button
            class="quit-btn"
            title="ゲームを中断"
            aria-label="ゲームを中断"
            @click="showQuitDialog = true"
          >
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
              <path
                d="M2 2 10 10M10 2 2 10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div class="progress-label">
            <span class="prog-cur">{{ progressCurrent }}</span>
            <span class="prog-sep"> / </span>
            <span class="prog-tot">{{ progressTotal }}</span>
            <span class="prog-word"> 問</span>
          </div>
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
          {{ DIFFICULTY_LABELS[state.settings.difficulty] }}
        </div>
        <Transition name="question" mode="out-in">
          <div :key="question.id" class="question-expr">
            {{ formatQuestion(question) }} <span class="question-eq">= ?</span>
          </div>
        </Transition>

        <!-- Feedback -->
        <div class="feedback-slot">
          <Transition name="feedback">
            <FeedbackDisplay
              v-if="state.feedback"
              :correct="state.feedback.correct"
              :correct-answer="state.feedback.correctAnswer"
            />
          </Transition>
        </div>

        <div class="gem-corner tl">◆</div>
        <div class="gem-corner tr">◆</div>
        <div class="gem-corner bl">◆</div>
        <div class="gem-corner br">◆</div>
      </div>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <div
        class="answer-input answer-display"
        :class="{
          empty: !inputValue,
          correct: state.feedback?.correct === true,
          incorrect: state.feedback?.correct === false,
        }"
      >
        {{ inputValue || '答えを入力' }}
      </div>
      <NumberPad
        :disabled="padDisabled"
        :can-delete="!!inputValue"
        @digit="pressDigit"
        @delete="pressDelete"
      />
    </div>

    <QuitDialog :open="showQuitDialog" @cancel="showQuitDialog = false" @confirm="confirmQuit" />
  </div>
</template>

<style scoped>
.game-root {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.game-header {
  flex-shrink: 0;
  padding: calc(0.8rem + max(1rem, env(safe-area-inset-top))) 1.2rem 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.quit-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-sub);
  font-size: 0.8rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
  flex-shrink: 0;
}
.quit-btn:hover {
  border-color: var(--gem-ruby);
  color: var(--gem-ruby);
}

.progress-label {
  font-weight: 700;
}
.prog-cur {
  font-size: 1.2rem;
  color: var(--gold-light);
  font-weight: 900;
}
.prog-sep,
.prog-tot {
  color: var(--text-sub);
  font-size: 0.9rem;
}
.prog-word {
  color: var(--text-sub);
  font-size: 0.8rem;
  margin-left: 2px;
}
.header-sub {
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: var(--text-sub);
  text-align: right;
}
.sep-dot {
  margin: 0 4px;
}

/* Question */
.question-area {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.5rem 1.2rem 1rem;
}
.question-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
  /* bottom = top + badge height + badge margin, so the expression sits at the vertical center */
  padding: 2.5rem 1.5rem calc(2.5rem + 26px + 1.2rem);
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
  font-size: clamp(1.2rem, 6.5vw, 2.6rem);
  font-weight: 900;
  color: var(--text-main);
  letter-spacing: 0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  white-space: nowrap;
}
.question-eq {
  font-weight: 800;
  color: var(--gold);
  filter: drop-shadow(0 0 8px rgba(201, 168, 54, 0.4));
}

/* Question change: the old one slides out to the left, the next slides in from the right */
.question-leave-active {
  transition:
    opacity 0.14s ease-in,
    transform 0.14s ease-in;
}
.question-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}
.question-enter-active {
  animation: question-in 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes question-in {
  from {
    opacity: 0;
    transform: translateX(32px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .question-leave-active {
    transition: none;
  }
  .question-enter-active {
    animation: none;
  }
}

/* Feedback sits in the card's bottom padding */
.feedback-slot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1.4rem;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.gem-corner {
  position: absolute;
  font-size: 0.55rem;
  color: var(--gem-blue);
  opacity: 0.5;
  filter: drop-shadow(0 0 4px var(--gem-blue));
}
.tl {
  top: 10px;
  left: 12px;
}
.tr {
  top: 10px;
  right: 12px;
}
.bl {
  bottom: 10px;
  left: 12px;
}
.br {
  bottom: 10px;
  right: 12px;
}

/* Input */
.input-area {
  flex: 1;
  min-height: 0;
  padding: 0 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}
.answer-display {
  flex-shrink: 0;
  font-size: 32px;
  line-height: 1.2;
  padding: 10px;
}
.answer-display.correct {
  border-color: var(--gem-emerald);
  color: #5ef0b5;
  box-shadow: 0 0 0 3px rgba(16, 200, 122, 0.2);
}
.answer-display.incorrect {
  border-color: var(--gem-ruby);
  color: #ff8aa5;
  box-shadow: 0 0 0 3px rgba(224, 48, 96, 0.2);
}
.answer-display.empty {
  color: #3a4e70;
  font-size: 20px;
  line-height: 1.92;
}

/* Compact layout for short screens */
@media (max-height: 700px) {
  .question-area {
    padding: 0.6rem 1.2rem;
  }
  .question-card {
    padding: 1.2rem 1.5rem calc(1.2rem + 26px + 0.5rem);
  }
  .diff-badge {
    margin-bottom: 0.5rem;
  }
  .feedback-slot {
    bottom: 0.6rem;
  }
  .input-area {
    gap: 0.5rem;
  }
}
</style>
