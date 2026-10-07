<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { formatElapsedTime } from '../logic/resultCalculator'

const store = useGameStore()
const result = computed(() => store.result)
const isGameOver = computed(() => result.value?.endReason === 'gameover')
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
        <p v-if="!isGameOver" class="result-sub">見事な勝利だ、勇者よ</p>
        <p v-else class="result-sub">また挑め、勇者よ</p>
      </div>

      <!-- Divider -->
      <div class="result-divider">
        <span>◆</span>
        <span>◇</span>
        <span>◆</span>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid rpg-card">
        <div class="stat-tile">
          <div class="stat-label">正解数</div>
          <div class="stat-value">
            {{ result.correctCount }}<span class="stat-denom"> / {{ result.totalAnswered }}</span>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">正答率</div>
          <div class="stat-value accent">{{ result.accuracy }}<span class="stat-unit">%</span></div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">ミス数</div>
          <div
            class="stat-value"
            :class="result.totalAnswered - result.correctCount > 0 ? 'danger' : ''"
          >
            {{ result.totalAnswered - result.correctCount }}
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">タイム</div>
          <div class="stat-time">{{ formatElapsedTime(result.elapsedSeconds) }}</div>
        </div>
        <div v-if="isGameOver" class="stat-tile stat-wide">
          <div class="stat-label">到達問題</div>
          <div class="stat-value">
            {{ result.totalAnswered }}<span class="stat-denom"> / {{ result.totalCount }}問</span>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="result-actions">
        <button class="btn-gem" @click="store.retryGame()">もう一度</button>
        <button class="btn-ghost" @click="store.resetGame()">ホームに戻る</button>
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
  gap: 1.4rem;
}

.result-header {
  text-align: center;
}
.result-icon {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 16px rgba(201, 168, 54, 0.5));
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
  gap: 0.75rem;
  padding: 1.2rem;
}
.stat-tile {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem 0.8rem;
  text-align: center;
}
.stat-wide {
  grid-column: 1 / -1;
}
.stat-label {
  font-size: 0.7rem;
  color: var(--text-sub);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 2rem;
  font-weight: 900;
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
</style>
