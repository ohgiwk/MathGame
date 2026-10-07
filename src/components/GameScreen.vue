<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { MAX_LIVES } from '../types/game'
import { formatQuestion } from '../logic/questionGenerator'
import ProgressBar from './ProgressBar.vue'
import HeartDisplay from './HeartDisplay.vue'
import FeedbackDisplay from './FeedbackDisplay.vue'

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

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

watch(question, () => {
  inputValue.value = ''
}, { immediate: true })

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

function handleKeydown(e: KeyboardEvent) {
  if (/^[0-9]$/.test(e.key)) pressDigit(e.key)
  else if (e.key === 'Backspace') pressDelete()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

function openQuitDialog() {
  showQuitDialog.value = true
}

function cancelQuit() {
  showQuitDialog.value = false
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
          <button class="quit-btn" @click="openQuitDialog" title="ゲームを中断">
            ✕
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
          {{ state.settings.difficulty === 'easy' ? '易しい' : state.settings.difficulty === 'normal' ? '普通' : '難しい' }}
        </div>
        <div class="question-expr">{{ formatQuestion(question) }} <span class="question-eq">= ?</span></div>

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
      <div class="num-pad">
        <button
          v-for="key in PAD_KEYS"
          :key="key"
          class="pad-key"
          :disabled="padDisabled"
          @click="pressDigit(key)"
        >
          {{ key }}
        </button>
        <span></span>
        <button class="pad-key" :disabled="padDisabled" @click="pressDigit('0')">0</button>
        <button
          class="pad-key pad-delete"
          :disabled="padDisabled || !inputValue"
          aria-label="1文字消す"
          @click="pressDelete"
        >
          ⌫
        </button>
      </div>
    </div>

    <!-- Quit confirmation dialog -->
    <Transition name="dialog">
      <div v-if="showQuitDialog" class="dialog-overlay" @click.self="cancelQuit">
        <div class="dialog-box">
          <div class="dialog-icon">⚑</div>
          <h2 class="dialog-title">ゲームを中断しますか？</h2>
          <p class="dialog-sub">進行中の記録は失われます</p>
          <div class="dialog-actions">
            <button class="dialog-cancel" @click="cancelQuit">続ける</button>
            <button class="dialog-confirm" @click="confirmQuit">中断する</button>
          </div>
        </div>
      </div>
    </Transition>
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
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
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
  transition: border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}
.quit-btn:hover {
  border-color: var(--gem-ruby);
  color: var(--gem-ruby);
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
  filter: drop-shadow(0 0 8px rgba(201,168,54,0.4));
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
.tl { top: 10px; left: 12px; }
.tr { top: 10px; right: 12px; }
.bl { bottom: 10px; left: 12px; }
.br { bottom: 10px; right: 12px; }

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
  color: #5EF0B5;
  box-shadow: 0 0 0 3px rgba(16,200,122,0.2);
}
.answer-display.incorrect {
  border-color: var(--gem-ruby);
  color: #FF8AA5;
  box-shadow: 0 0 0 3px rgba(224,48,96,0.2);
}
.answer-display.empty {
  color: #3A4E70;
  font-size: 20px;
  line-height: 1.92;
}

.num-pad {
  flex: 1;
  min-height: 0;
  max-height: 320px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 0.6rem;
}
.pad-key {
  background: var(--bg-card);
  border: 1px solid var(--border-gem);
  border-radius: 14px;
  color: var(--text-main);
  font-size: 1.7rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  transition: transform 0.08s ease, background 0.08s ease;
}
.pad-key:active:not(:disabled) {
  transform: scale(0.95);
  background: #1C2B50;
  border-color: var(--gem-blue);
}
.pad-key:disabled { opacity: 0.45; cursor: default; }
.pad-delete { color: var(--text-sub); font-size: 1.4rem; }

/* Compact layout for short screens */
@media (max-height: 700px) {
  .question-area { padding: 0.6rem 1.2rem; }
  .question-card { padding: 1.2rem 1.5rem calc(1.2rem + 26px + 0.5rem); }
  .diff-badge { margin-bottom: 0.5rem; }
  .feedback-slot { bottom: 0.6rem; }
  .input-area { gap: 0.5rem; }
  .num-pad { gap: 0.45rem; }
}

/* Quit dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.dialog-box {
  background: linear-gradient(145deg, #162040, #1A2744);
  border: 1px solid var(--border-gem);
  border-radius: 20px;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 24px rgba(59,92,240,0.2);
}
.dialog-icon {
  font-size: 2.2rem;
  margin-bottom: 0.8rem;
  color: var(--gold);
  filter: drop-shadow(0 0 8px rgba(201,168,54,0.4));
}
.dialog-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 0.4rem;
}
.dialog-sub {
  font-size: 0.78rem;
  color: var(--text-sub);
  margin-bottom: 1.5rem;
}
.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.dialog-cancel {
  background: transparent;
  border: 1px solid var(--border-gem);
  border-radius: 12px;
  color: var(--text-sub);
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.dialog-cancel:hover {
  border-color: var(--text-sub);
  color: var(--text-main);
}
.dialog-confirm {
  background: linear-gradient(135deg, #7B1A2A, #B02030);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(180,30,50,0.4);
  transition: transform 0.1s;
}
.dialog-confirm:active { transform: scale(0.96); }

.dialog-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dialog-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dialog-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
