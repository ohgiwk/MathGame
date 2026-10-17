<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useStatsStore } from '../stores/statsStore'
import { summarize, recordsLike } from '../logic/statsCalculator'
import { formatScore, formatElapsedTime, formatTotalTime, formatPlayedDate } from '../logic/format'
import {
  RATING_LABELS,
  DIFFICULTY_LABELS,
  operationLabel,
  questionCountLabel,
} from '../logic/labels'
import { useCountUp } from '../composables/useCountUp'

const store = useGameStore()
const statsStore = useStatsStore()
const result = computed(() => store.result)
const outcome = computed(() => store.result?.outcome)
const isEndless = computed(() => outcome.value?.questionCount === 'endless')
// an endless game always ends by running out of lives, which is its finish rather than a failure
const isGameOver = computed(() => outcome.value?.endReason === 'gameover' && !isEndless.value)

// The result is fixed while this screen is shown, so the numbers count up once on entry.
// Delays follow the order in which the tiles pop in.
const r = store.result
const mistakes = r ? r.outcome.totalAnswered - r.outcome.correctCount : 0
const shownScore = useCountUp(r?.score.score ?? 0, { duration: 1000, delay: 250 })
const shownCorrect = useCountUp(r?.outcome.correctCount ?? 0, { duration: 600, delay: 370 })
const shownAccuracy = useCountUp(r?.accuracy ?? 0, { duration: 600, delay: 490 })
const shownMistakes = useCountUp(mistakes, { duration: 600, delay: 610 })
const shownSeconds = useCountUp(r?.outcome.elapsedSeconds ?? 0, { duration: 600, delay: 730 })

// The panel has three slides side by side: this game's result, the earlier games with the same
// settings (this one included, as the newest), and the totals over every game played so far.
// It is swiped like a carousel; the dots also switch slides.
const SLIDE_LABELS = ['今回の結果', '同じ種別の履歴', '累計']
const total = computed(() => summarize(statsStore.records))

const HISTORY_LIMIT = 30
const sameKind = computed(() =>
  outcome.value ? recordsLike(statsStore.records, outcome.value) : [],
)
const sameKindBest = computed(() => summarize(sameKind.value).bestScore)
const sameKindHistory = computed(() => sameKind.value.slice(0, HISTORY_LIMIT))
const slidesRef = ref<HTMLElement | null>(null)
const activeSlide = ref(0)

function syncActiveSlide() {
  const el = slidesRef.value
  if (el) activeSlide.value = Math.round(el.scrollLeft / el.clientWidth)
}

function showSlide(index: number) {
  const el = slidesRef.value
  el?.scrollTo({ left: index * el.clientWidth })
}

// Once the numbers have finished counting up and had a moment to be read, the panel moves on to
// the history by itself. Touching the panel first means the player is steering, so it stays put.
const COUNT_UP_END_MS = 1330
const RESULT_HOLD_MS = 2500
let autoSlideTimer: ReturnType<typeof setTimeout> | null = null

function cancelAutoSlide() {
  if (autoSlideTimer !== null) {
    clearTimeout(autoSlideTimer)
    autoSlideTimer = null
  }
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  autoSlideTimer = setTimeout(() => {
    autoSlideTimer = null
    showSlide(1)
  }, COUNT_UP_END_MS + RESULT_HOLD_MS)
})

onBeforeUnmount(cancelAutoSlide)
</script>

<template>
  <div v-if="result && outcome" class="result-root">
    <div class="result-inner fade-in-up">
      <!-- Title -->
      <div class="result-header">
        <div class="result-icon">{{ isEndless ? '🏅' : isGameOver ? '💀' : '🏆' }}</div>
        <h1 class="result-title" :class="isGameOver ? 'title-over' : 'title-clear'">
          {{
            isEndless ? 'FINISH!' : result.rating ? RATING_LABELS[result.rating] : 'ゲームオーバー'
          }}
        </h1>
        <p v-if="isEndless" class="result-sub">エンドレス · {{ outcome.correctCount }}問正解</p>
        <p v-else-if="isGameOver" class="result-sub">
          到達 {{ outcome.totalAnswered }} / {{ outcome.questionCount }}問
        </p>
      </div>

      <!-- Divider -->
      <div class="result-divider">
        <span>◆</span>
        <span>◇</span>
        <span>◆</span>
      </div>

      <!-- Result panel: this game / history / totals -->
      <div class="result-panel rpg-card">
        <div
          ref="slidesRef"
          class="slides"
          @scroll.passive="syncActiveSlide"
          @pointerdown.passive="cancelAutoSlide"
          @wheel.passive="cancelAutoSlide"
        >
          <div class="stats-grid">
            <div class="tile stat-tile stat-wide score-tile" style="--i: 0">
              <div class="stat-label">スコア</div>
              <div class="score-value">{{ formatScore(shownScore) }}</div>
              <div v-if="result.isBestScore" class="best-badge pill pill-success">
                自己ベスト更新！
              </div>
            </div>
            <div class="tile stat-tile" style="--i: 1">
              <div class="stat-label">正解数</div>
              <div class="stat-value">
                {{ shownCorrect }}<span class="stat-denom"> / {{ outcome.totalAnswered }}</span>
              </div>
            </div>
            <div class="tile stat-tile" style="--i: 2">
              <div class="stat-label">正答率</div>
              <div class="stat-value accent">
                {{ shownAccuracy }}<span class="stat-unit">%</span>
              </div>
            </div>
            <div class="tile stat-tile" style="--i: 3">
              <div class="stat-label">ミス数</div>
              <div class="stat-value" :class="mistakes > 0 ? 'danger' : ''">
                {{ shownMistakes }}
              </div>
            </div>
            <div class="tile stat-tile" style="--i: 4">
              <div class="stat-label">タイム</div>
              <div class="stat-time">{{ formatElapsedTime(shownSeconds) }}</div>
            </div>
          </div>
          <div class="history-slide">
            <div class="history-inner">
              <div class="history-head">
                <span class="history-kind">
                  {{ DIFFICULTY_LABELS[outcome.difficulty] }} ·
                  {{ operationLabel(outcome.operation, outcome.mixedOperations) }} ·
                  {{ questionCountLabel(outcome.questionCount) }}
                </span>
                <span class="history-count">{{ sameKind.length }}回</span>
              </div>
              <ol class="history-list">
                <li
                  v-for="(rec, i) in sameKindHistory"
                  :key="rec.id"
                  class="history-row"
                  :class="{ current: i === 0 }"
                >
                  <div class="history-when">
                    <span v-if="i === 0" class="now-tag">今回</span>
                    <span v-else>{{ formatPlayedDate(rec.playedAt) }}</span>
                  </div>
                  <div class="history-detail">
                    {{ rec.correctCount }} / {{ rec.totalAnswered }} ·
                    {{ formatElapsedTime(rec.elapsedSeconds) }}
                  </div>
                  <div class="history-score">
                    <span v-if="rec.score === sameKindBest && rec.score > 0" class="best-mark"
                      >★</span
                    >{{ formatScore(rec.score) }}
                  </div>
                </li>
              </ol>
            </div>
          </div>
          <div class="stats-grid">
            <div class="tile stat-tile stat-wide score-tile">
              <div class="stat-label">累計スコア</div>
              <div class="score-value">{{ formatScore(total.totalScore) }}</div>
            </div>
            <div class="tile stat-tile">
              <div class="stat-label">プレイ回数</div>
              <div class="stat-value">{{ total.playCount }}<span class="stat-unit">回</span></div>
            </div>
            <div class="tile stat-tile">
              <div class="stat-label">クリア回数</div>
              <div class="stat-value">{{ total.clearCount }}<span class="stat-unit">回</span></div>
            </div>
            <div class="tile stat-tile">
              <div class="stat-label">正答率</div>
              <div class="stat-value accent">
                {{ total.accuracy ?? '–'
                }}<span v-if="total.accuracy !== null" class="stat-unit">%</span>
              </div>
            </div>
            <div class="tile stat-tile">
              <div class="stat-label">累計タイム</div>
              <div class="stat-time">{{ formatTotalTime(total.elapsedSeconds) }}</div>
            </div>
          </div>
        </div>
        <div class="slide-dots">
          <button
            v-for="(label, i) in SLIDE_LABELS"
            :key="label"
            class="slide-dot"
            :class="{ active: activeSlide === i }"
            :aria-label="label"
            :aria-current="activeSlide === i"
            @click="(cancelAutoSlide(), showSlide(i))"
          ></button>
        </div>
      </div>

      <!-- Buttons -->
      <div class="result-actions">
        <button class="btn-gem btn-gold" @click="store.startGame()">
          <span class="btn-gold-gem">◆</span>
          <span class="btn-gold-label">TRY AGAIN</span>
          <span class="btn-gold-gem">◆</span>
        </button>
        <div class="result-links">
          <button class="btn-ghost" @click="store.goHome()">Go to Home</button>
          <button class="btn-ghost" @click="store.openStats()">My Records</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-root {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(2rem, env(safe-area-inset-top)) 1.2rem max(2rem, env(safe-area-inset-bottom));
}
.result-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.result-header {
  text-align: center;
}
.result-icon {
  font-size: 2.6rem;
  line-height: 1.2;
  margin-bottom: 0.2rem;
  filter: drop-shadow(0 0 16px rgba(var(--gold-rgb), 0.5));
}
.result-title {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.title-clear {
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.title-over {
  color: var(--text-muted);
}
.result-sub {
  color: var(--text-sub);
  font-size: 0.82rem;
  margin-top: 0.3rem;
  letter-spacing: 0.08em;
}

.result-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--border-gem);
  font-size: 0.6rem;
}
/* light theme: a ruled line with a ring at its middle */
:root[data-theme='light'] .result-divider {
  gap: 8px;
  color: var(--text-sub);
}
:root[data-theme='light'] .result-divider span {
  font-size: 0;
  width: 56px;
  border-top: 1px solid currentColor;
  opacity: 0.6;
}
:root[data-theme='light'] .result-divider span:nth-child(2) {
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--gold);
  border-radius: 50%;
  opacity: 1;
}

.result-panel {
  overflow: hidden;
}
.slides {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
}
.stats-grid {
  flex: 0 0 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  padding: 1rem 1rem 0.7rem;
}
/* The history list scrolls inside the height the other slides set, rather than stretching the panel */
.history-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
}
.history-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem 0.7rem;
}
.history-head {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}
.history-kind {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-count {
  font-size: 0.7rem;
  color: var(--text-sub);
}
.history-list {
  list-style: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.history-row {
  display: grid;
  grid-template-columns: 3.4rem 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.4rem;
  border-bottom: 1px solid rgba(var(--wash-rgb), 0.06);
  font-variant-numeric: tabular-nums;
}
.history-row.current {
  background: rgba(var(--gold-rgb), 0.08);
  border-radius: 8px;
}
.history-when {
  font-size: 0.72rem;
  color: var(--text-sub);
}
.now-tag {
  font-weight: 800;
  color: var(--gold-light);
  letter-spacing: 0.08em;
}
.history-detail {
  font-size: 0.72rem;
  color: var(--text-sub);
  white-space: nowrap;
}
.history-score {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--gold-light);
  text-align: right;
}
.best-mark {
  font-size: 0.7rem;
  margin-right: 3px;
  color: var(--gold);
  filter: drop-shadow(0 0 4px rgba(var(--gold-rgb), 0.6));
}

.slide-dots {
  display: flex;
  justify-content: center;
  gap: 2px;
  padding-bottom: 0.5rem;
}
/* the dot is drawn by ::before so the button itself keeps a comfortable touch target */
.slide-dot {
  width: 24px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slide-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-gem);
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}
.slide-dot.active::before {
  background: var(--gold-light);
  transform: scale(1.3);
}
/* Tiles pop in one after another while their numbers count up */
.stat-tile {
  padding: 0.7rem 0.8rem;
  animation: tile-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i, 0) * 120ms + 150ms);
}
@keyframes tile-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.94);
  }
}
.best-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 12px;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  animation: pop-in 0.3s ease 1.35s backwards;
}
@media (prefers-reduced-motion: reduce) {
  .stat-tile,
  .best-badge {
    animation: none;
  }
  .slides {
    scroll-behavior: auto;
  }
}
.stat-wide {
  grid-column: 1 / -1;
}
.score-tile {
  border-color: rgba(var(--gold-rgb), 0.5);
  background: rgba(var(--gold-rgb), 0.06);
}
.score-value {
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1.15;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 14px rgba(var(--gold-light-rgb), 0.45);
}
:root[data-theme='light'] .score-value {
  text-shadow: none;
}
:root[data-theme='light'] .result-icon,
:root[data-theme='light'] .best-mark {
  filter: none;
}
.stat-label {
  font-size: 0.7rem;
  color: var(--text-sub);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1.3;
  color: var(--gold-light);
}
.stat-value.accent {
  color: var(--gem-teal);
}
.stat-value.danger {
  color: var(--gem-ruby);
}
.stat-denom {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-sub);
}
.stat-unit {
  font-size: 1rem;
}
.stat-time {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-main);
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.result-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.result-links .btn-ghost {
  padding: 13px 4px;
  font-size: 0.95rem;
}
</style>
