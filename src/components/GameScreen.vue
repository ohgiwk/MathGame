<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { MAX_LIVES } from '../logic/constants'
import { formatQuestion } from '../logic/format'
import { DIFFICULTY_LABELS } from '../logic/labels'
import ProgressBar from './ProgressBar.vue'
import HeartDisplay from './HeartDisplay.vue'
import FeedbackDisplay from './FeedbackDisplay.vue'
import NumberPad from './NumberPad.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import CloseIcon from './CloseIcon.vue'

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
const isEndless = computed(() => state.value?.settings.questionCount === 'endless')
const progressTotal = computed(() => state.value?.questions.length ?? 1)

// ---- time limit ----
/** Seconds left at which the countdown turns red */
const TIME_WARNING_SECONDS = 3
const TIMER_RADIUS = 17
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS
const remainingMs = ref(0)
let frame: number | null = null

function tick() {
  const s = state.value
  if (s?.deadline != null) remainingMs.value = Math.max(s.deadline - Date.now(), 0)
  else if (s?.pausedRemainingMs != null) remainingMs.value = s.pausedRemainingMs
  // with neither set the question is settled, and the bar stays where it stopped
  frame = requestAnimationFrame(tick)
}
if (state.value?.timeLimitMs != null) tick()
onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame)
})

const timeRatio = computed(() => {
  const limit = state.value?.timeLimitMs
  return limit ? remainingMs.value / limit : 0
})
const remainingSeconds = computed(() => Math.ceil(remainingMs.value / 1000))
const timeWarning = computed(
  () => remainingSeconds.value <= TIME_WARNING_SECONDS && !state.value?.feedback,
)

// the question's timing (and countdown) stops while the player decides whether to quit
watch(showQuitDialog, (open) => {
  if (open) store.pauseQuestion()
  else store.resumeQuestion()
})

const answerLength = computed(() => String(question.value?.answer ?? '').length)
const padDisabled = computed(() => !!state.value?.feedback || showQuitDialog.value)

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
  store.goHome()
}
</script>

<template>
  <div v-if="state && question" class="game-root">
    <!-- Header -->
    <div class="game-header enter-drop">
      <div class="header-top">
        <div class="header-left">
          <button
            class="quit-btn"
            title="ゲームを中断"
            aria-label="ゲームを中断"
            @click="showQuitDialog = true"
          >
            <CloseIcon />
          </button>
          <div class="progress-label">
            <span class="prog-cur">{{ progressCurrent }}</span>
            <template v-if="isEndless">
              <span class="prog-word"> 問目</span>
              <span class="endless-badge">∞</span>
            </template>
            <template v-else>
              <span class="prog-sep"> / </span>
              <span class="prog-tot">{{ progressTotal }}</span>
              <span class="prog-word"> 問</span>
            </template>
          </div>
        </div>
        <HeartDisplay :lives="state.lives" />
      </div>
      <ProgressBar v-if="!isEndless" :current="progressCurrent" :total="progressTotal" />
      <div class="header-sub">
        正解 {{ state.correctCount }}
        <span class="sep-dot">·</span>
        残りミス {{ state.lives }} / {{ MAX_LIVES }}
      </div>
    </div>

    <!-- Question card -->
    <div class="question-area enter-pop">
      <div class="question-card rpg-card">
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
              :timed-out="state.feedback.timedOut"
            />
          </Transition>
        </div>

        <!-- Countdown ring in the corner, so the header keeps a single progress bar -->
        <div
          v-if="state.timeLimitMs !== null"
          class="timer"
          :class="{ warning: timeWarning }"
          role="timer"
          :aria-label="`残り${remainingSeconds}秒`"
        >
          <svg class="timer-ring" viewBox="0 0 40 40" aria-hidden="true">
            <circle class="timer-track" cx="20" cy="20" :r="TIMER_RADIUS" />
            <circle
              class="timer-fill"
              cx="20"
              cy="20"
              :r="TIMER_RADIUS"
              :stroke-dasharray="TIMER_CIRCUMFERENCE"
              :stroke-dashoffset="TIMER_CIRCUMFERENCE * (1 - timeRatio)"
            />
          </svg>
          <span class="timer-sec">{{ remainingSeconds }}</span>
        </div>

        <div class="gem-corner tl">◆</div>
        <div v-if="state.timeLimitMs === null" class="gem-corner tr">◆</div>
        <div class="gem-corner bl">◆</div>
        <div class="gem-corner br">◆</div>
      </div>
    </div>

    <!-- Input area -->
    <div class="input-area">
      <div
        class="answer-input answer-display enter-rise"
        :class="{
          empty: !inputValue,
          correct: state.feedback?.correct === true,
          incorrect: state.feedback?.correct === false,
        }"
      >
        {{ inputValue || '答えを入力' }}
      </div>
      <NumberPad
        class="enter-rise enter-late"
        :disabled="padDisabled"
        :can-delete="!!inputValue"
        @digit="pressDigit"
        @delete="pressDelete"
      />
    </div>

    <ConfirmDialog
      :open="showQuitDialog"
      icon="⚑"
      title="ゲームを中断しますか？"
      message="進行中の記録は失われます"
      cancel-label="続ける"
      confirm-label="中断する"
      @cancel="showQuitDialog = false"
      @confirm="confirmQuit"
    />
  </div>
</template>

<style scoped>
.game-root {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.game-header {
  flex-shrink: 0;
  padding: calc(0.8rem + max(1rem, env(safe-area-inset-top))) 1.2rem 0.6rem;
  border-bottom: 1px solid rgba(var(--wash-rgb), 0.05);
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
.endless-badge {
  margin-left: 6px;
  padding: 0 7px;
  border: 1px solid rgba(var(--gold-rgb), 0.5);
  border-radius: 99px;
  color: var(--gold-light);
  font-size: 0.8rem;
}

/* Countdown for the current question: a ring in the card's top-right corner */
.timer {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gem-teal);
  transition: color 0.2s ease;
}
.timer-ring {
  position: absolute;
  inset: 0;
  /* start the ring at 12 o'clock */
  transform: rotate(-90deg);
}
.timer-track,
.timer-fill {
  fill: none;
  stroke-width: 3;
}
.timer-track {
  stroke: rgba(var(--wash-rgb), 0.08);
}
.timer-fill {
  stroke: currentColor;
  stroke-linecap: round;
  filter: drop-shadow(0 0 3px currentColor);
}
.timer-sec {
  position: relative;
  font-size: 0.9rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.timer.warning {
  color: var(--gem-ruby);
}
.timer.warning .timer-sec {
  animation: timer-beat 1s ease-in-out infinite;
}
@keyframes timer-beat {
  50% {
    transform: scale(1.25);
  }
}
@media (prefers-reduced-motion: reduce) {
  .timer.warning .timer-sec {
    animation: none;
  }
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

/* Entrance when the game starts: header drops in, the card pops, the input and pad rise */
.enter-drop {
  animation: enter-drop 0.4s ease-out backwards;
}
.enter-pop {
  animation: enter-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards;
}
.enter-rise {
  animation: enter-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.2s backwards;
}
.enter-late {
  animation-delay: 0.28s;
}
@keyframes enter-drop {
  from {
    opacity: 0;
    transform: translateY(-18px);
  }
}
@keyframes enter-pop {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
}
@keyframes enter-rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .enter-drop,
  .enter-pop,
  .enter-rise {
    animation: none;
  }
}

/* Question */
/* the card takes whatever height the header and the pad leave */
.question-area {
  flex: 1;
  min-height: 0;
  display: flex;
  padding: 1.25rem 0 1rem;
}
/* The card spans the screen like the number pad, ruled off above and below */
.question-card {
  width: 100%;
  border-radius: 0;
  border-left: none;
  border-right: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  /* bottom = top + badge height + badge margin, so the expression sits at the vertical center */
  padding: 2.5rem 1.5rem calc(2.5rem + 26px + 1.2rem);
  position: relative;
  animation: gem-pulse 3s ease infinite;
}
:root[data-theme='light'] .question-card {
  animation: none;
}
:root[data-theme='light'] .question-eq,
:root[data-theme='light'] .timer-fill {
  filter: none;
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
  filter: drop-shadow(0 0 8px rgba(var(--gold-rgb), 0.4));
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
/* light theme: no corner ornaments */
:root[data-theme='light'] .gem-corner {
  display: none;
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

/* Input: the answer and the pad sit at the bottom of the screen, edge to edge */
.input-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.answer-display {
  flex-shrink: 0;
  font-size: 32px;
  line-height: 1.2;
  padding: 10px;
  border-radius: 0;
  border-width: 1px 0 0;
  border-color: var(--border);
}
/* the state is drawn inside, so it lines up with the pad below */
.answer-display.correct {
  color: var(--success-text);
  background: rgba(var(--emerald-rgb), 0.08);
  box-shadow: inset 0 0 0 2px var(--gem-emerald);
}
.answer-display.incorrect {
  color: var(--danger-text);
  background: rgba(var(--ruby-rgb), 0.08);
  box-shadow: inset 0 0 0 2px var(--gem-ruby);
}
.answer-display.empty {
  color: var(--text-placeholder);
  font-size: 20px;
  line-height: 1.92;
}

/* Compact layout for short screens */
@media (max-height: 700px) {
  .question-area {
    padding: 0.6rem 0;
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
}
</style>
