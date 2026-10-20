<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useHundredStore } from '../stores/hundredStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import { CELL_COUNT, cellOperands, countCorrect, formatLapTime } from '../logic/hundredGrid'
import { OPERATOR_SYMBOLS, OPERATION_LABELS } from '../logic/labels'
import { soundPlayer } from '../logic/sound'
import HundredGridView from './HundredGridView.vue'
import NumberPad from './NumberPad.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import CloseIcon from './CloseIcon.vue'

const store = useGameStore()
const hundred = useHundredStore()
const preferences = usePreferencesStore()

const play = computed(() => hundred.play)
const draft = ref('')
const showQuitDialog = ref(false)
/** the last cell turns red for a moment after a wrong answer */
const missFlash = ref(false)

/** answered cells that are wrong; every cell before the current one is answered */
const mistakes = computed(() => {
  const p = play.value
  return p ? p.currentIndex - countCorrect(p.grid, p.inputs) : 0
})

const operands = computed(() => {
  const p = play.value
  return p ? cellOperands(p.grid, p.currentIndex) : null
})

// ---- the running time ----
const elapsed = ref(0)
let frame: number | null = null
function tick() {
  elapsed.value = hundred.elapsedMs()
  frame = requestAnimationFrame(tick)
}
tick()
onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame)
})

watch(showQuitDialog, (open) => {
  if (open) hundred.pause()
  else hundred.resume()
})

const answerLength = computed(() => String(hundred.currentAnswer ?? '').length)
const padDisabled = computed(() => !play.value || showQuitDialog.value)

function playSound(name: 'tap' | 'incorrect' | 'clear', pitch = 1) {
  if (preferences.soundEffects) soundPlayer.play(name, pitch)
}

// Like the arithmetic game, a cell is filled once as many digits as its answer has are entered
function pressDigit(digit: string) {
  if (padDisabled.value || draft.value.length >= answerLength.value) return
  draft.value += digit
  if (draft.value.length < answerLength.value) {
    playSound('tap')
    return
  }
  const input = draft.value
  draft.value = ''
  const last = play.value?.currentIndex === CELL_COUNT - 1
  const correct = hundred.submit(input)
  if (last) playSound('clear')
  else if (correct) playSound('tap', 1.25)
  else {
    playSound('incorrect')
    missFlash.value = false
    requestAnimationFrame(() => (missFlash.value = true))
  }
}

function pressDelete() {
  if (padDisabled.value) return
  draft.value = draft.value.slice(0, -1)
  playSound('tap', 0.8)
}

function confirmQuit() {
  showQuitDialog.value = false
  store.goHome()
}
</script>

<template>
  <div v-if="play && operands" class="hundred-root">
    <div class="hundred-header enter-drop">
      <button
        class="quit-btn"
        title="ゲームを中断"
        aria-label="ゲームを中断"
        @click="showQuitDialog = true"
      >
        <CloseIcon />
      </button>
      <div class="mode-name">
        百ます計算 <span class="mode-op">{{ OPERATION_LABELS[play.grid.operation] }}</span>
      </div>
      <div class="lap" role="timer" aria-label="経過時間">{{ formatLapTime(elapsed) }}</div>
    </div>
    <div class="status-row">
      <span
        ><span class="count">{{ play.currentIndex }}</span> / {{ CELL_COUNT }}</span
      >
      <span :class="{ miss: mistakes > 0 }">ミス {{ mistakes }}</span>
    </div>

    <div class="grid-wrap enter-pop">
      <HundredGridView
        :grid="play.grid"
        :inputs="play.inputs"
        :current-index="play.currentIndex"
        :draft="draft"
      />
    </div>

    <div class="input-area enter-rise">
      <div
        class="answer-input answer-bar"
        :class="{ incorrect: missFlash }"
        @animationend="missFlash = false"
      >
        <span class="expr"
          >{{ operands.a }} {{ OPERATOR_SYMBOLS[play.grid.operation] }} {{ operands.b }} =</span
        >
        <span class="draft" :class="{ empty: !draft }">{{ draft || '?' }}</span>
      </div>
      <NumberPad
        class="hundred-pad"
        :disabled="padDisabled"
        :can-delete="!!draft"
        @digit="pressDigit"
        @delete="pressDelete"
      />
    </div>

    <ConfirmDialog
      :open="showQuitDialog"
      icon="⚑"
      title="ゲームを中断しますか？"
      message="ここまでのタイムは記録されません"
      cancel-label="続ける"
      confirm-label="中断する"
      @cancel="showQuitDialog = false"
      @confirm="confirmQuit"
    />
  </div>
</template>

<style scoped>
.hundred-root {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.hundred-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: calc(0.4rem + max(1rem, env(safe-area-inset-top))) 1rem 0.3rem;
}
.quit-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-sub);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.mode-name {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-main);
}
.mode-op {
  margin-left: 4px;
  font-size: 0.7rem;
  color: var(--text-sub);
}
.lap {
  margin-left: auto;
  font-size: 1.4rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--gold-light);
}
.status-row {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem 0.4rem;
  font-size: 0.72rem;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.count {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--gold-light);
}
.miss {
  color: var(--danger-text);
}

/* the grid takes whatever the header and the pad leave, as a square */
.grid-wrap {
  flex: 1;
  min-height: 0;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.5rem 0.5rem;
}

.input-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.answer-bar {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
  font-size: 26px;
  line-height: 1.2;
  padding: 8px;
  border-radius: 0;
  border-width: 1px 0 0;
  border-color: var(--border);
}
.expr {
  color: var(--text-sub);
}
.draft {
  min-width: 2ch;
  text-align: left;
  color: var(--text-main);
}
.draft.empty {
  color: var(--text-placeholder);
}
.answer-bar.incorrect {
  animation: miss-flash 0.4s ease-out;
}
@keyframes miss-flash {
  0% {
    background: rgba(var(--ruby-rgb), 0.2);
    box-shadow: inset 0 0 0 2px var(--gem-ruby);
  }
}
/* shorter than in the arithmetic game, to leave room for the grid */
.hundred-root .hundred-pad {
  height: clamp(190px, 32vh, 300px);
}

.enter-drop {
  animation: enter-drop 0.4s ease-out backwards;
}
.enter-pop {
  animation: enter-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards;
}
.enter-rise {
  animation: enter-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.2s backwards;
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
    transform: scale(0.94);
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
  .enter-rise,
  .answer-bar.incorrect {
    animation: none;
  }
}
</style>
