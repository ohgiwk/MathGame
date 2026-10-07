<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { formatElapsedTime } from '../logic/resultCalculator'
import { formatScore } from '../logic/scoreCalculator'
import { useCountUp } from '../composables/useCountUp'

const store = useGameStore()
const result = computed(() => store.result)
const isGameOver = computed(() => result.value?.endReason === 'gameover')

// The result is fixed while this screen is shown, so the numbers count up once on entry.
// Delays follow the order in which the tiles pop in.
const r = store.result
const mistakes = r ? r.totalAnswered - r.correctCount : 0
const shownScore = useCountUp(r?.score.score ?? 0, { duration: 1000, delay: 250 })
const shownCorrect = useCountUp(r?.correctCount ?? 0, { duration: 600, delay: 370 })
const shownAccuracy = useCountUp(r?.accuracy ?? 0, { duration: 600, delay: 490 })
const shownMistakes = useCountUp(mistakes, { duration: 600, delay: 610 })
const shownSeconds = useCountUp(r?.elapsedSeconds ?? 0, { duration: 600, delay: 730 })
</script>

<template>
  <div v-if="result" class="result-root">
    <div class="result-inner fade-in-up">
      <!-- Title -->
      <div class="result-header">
        <div class="result-icon">{{ isGameOver ? '💀' : '🏆' }}</div>
        <h1 class="result-title" :class="isGameOver ? 'title-over' : 'title-clear'">
          {{ isGameOver ? 'ゲームオーバー' : 'ゲームクリア！' }}
        </h1>
        <p v-if="isGameOver" class="result-sub">
          到達 {{ result.totalAnswered }} / {{ result.totalCount }}問
        </p>
      </div>

      <!-- Divider -->
      <div class="result-divider">
        <span>◆</span>
        <span>◇</span>
        <span>◆</span>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid rpg-card">
        <div class="stat-tile stat-wide score-tile" style="--i: 0">
          <div class="stat-label">スコア</div>
          <div class="score-value">{{ formatScore(shownScore) }}</div>
          <div v-if="result.isBestScore" class="best-badge">自己ベスト更新！</div>
        </div>
        <div class="stat-tile" style="--i: 1">
          <div class="stat-label">正解数</div>
          <div class="stat-value">
            {{ shownCorrect }}<span class="stat-denom"> / {{ result.totalAnswered }}</span>
          </div>
        </div>
        <div class="stat-tile" style="--i: 2">
          <div class="stat-label">正答率</div>
          <div class="stat-value accent">{{ shownAccuracy }}<span class="stat-unit">%</span></div>
        </div>
        <div class="stat-tile" style="--i: 3">
          <div class="stat-label">ミス数</div>
          <div class="stat-value" :class="mistakes > 0 ? 'danger' : ''">
            {{ shownMistakes }}
          </div>
        </div>
        <div class="stat-tile" style="--i: 4">
          <div class="stat-label">タイム</div>
          <div class="stat-time">{{ formatElapsedTime(shownSeconds) }}</div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="result-actions">
        <button class="btn-gem btn-gold" @click="store.retryGame()">
          <span class="btn-gold-gem">◆</span>
          <span class="btn-gold-label">TRY AGAIN</span>
          <span class="btn-gold-gem">◆</span>
        </button>
        <div class="result-links">
          <button class="btn-ghost" @click="store.resetGame()">ホームに戻る</button>
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
  color: #8090b0;
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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  padding: 1rem;
}
.stat-tile {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  text-align: center;
}
/* Tiles pop in one after another while their numbers count up */
.stat-tile {
  animation: tile-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 120ms + 150ms);
}
@keyframes tile-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.94);
  }
}
.best-badge {
  animation: pop-in 0.3s ease 1.35s backwards;
}
@media (prefers-reduced-motion: reduce) {
  .stat-tile,
  .best-badge {
    animation: none;
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
  text-shadow: 0 0 14px rgba(224, 192, 96, 0.45);
}
.best-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 12px;
  border-radius: 99px;
  border: 1px solid rgba(var(--emerald-rgb), 0.6);
  background: rgba(var(--emerald-rgb), 0.14);
  color: var(--success-text);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
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
