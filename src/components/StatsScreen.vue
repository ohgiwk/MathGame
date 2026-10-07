<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useStatsStore } from '../stores/statsStore'
import type { Difficulty } from '../types/game'
import { formatElapsedTime } from '../logic/resultCalculator'
import { formatScore } from '../logic/scoreCalculator'
import { DIFFICULTIES, DIFFICULTY_LABELS, OPERATION_LABELS } from '../logic/labels'
import {
  summarize,
  summarizeByOperation,
  formatTotalTime,
  formatPlayedAt,
} from '../logic/statsCalculator'

const HISTORY_LIMIT = 30

const store = useGameStore()
const statsStore = useStatsStore()

const selectedDifficulty = ref<Difficulty>(store.settings.difficulty)

const total = computed(() => summarize(statsStore.records))
const byOperation = computed(() =>
  summarizeByOperation(statsStore.records, selectedDifficulty.value),
)
const history = computed(() => statsStore.records.slice(0, HISTORY_LIMIT))
</script>

<template>
  <div class="stats-root">
    <div class="stats-inner fade-in-up">
      <!-- Header -->
      <div class="stats-header">
        <button class="back-btn" aria-label="ホームに戻る" @click="store.resetGame()">‹</button>
        <h1 class="stats-title">My Records</h1>
      </div>

      <!-- 累計 -->
      <div class="rpg-card stats-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 累計
          <span class="section-note">
            正解 {{ total.correctCount }} / {{ total.totalAnswered }}問 ·
            {{ formatTotalTime(total.elapsedSeconds) }}
          </span>
        </h2>
        <div class="total-row">
          <div class="total-item">
            <div class="total-label">プレイ</div>
            <div class="total-value">{{ total.playCount }}<span class="total-unit">回</span></div>
          </div>
          <div class="total-item">
            <div class="total-label">クリア</div>
            <div class="total-value">{{ total.clearCount }}<span class="total-unit">回</span></div>
          </div>
          <div class="total-item">
            <div class="total-label">正答率</div>
            <div class="total-value accent">
              {{ total.accuracy ?? '–'
              }}<span v-if="total.accuracy !== null" class="total-unit">%</span>
            </div>
          </div>
          <div class="total-item">
            <div class="total-label">累計スコア</div>
            <div class="total-value">{{ formatScore(total.totalScore) }}</div>
          </div>
        </div>
      </div>

      <!-- 難易度・種類ごと -->
      <div class="rpg-card stats-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 種類ごと
          <span class="diff-tabs">
            <button
              v-for="d in DIFFICULTIES"
              :key="d"
              class="diff-tab"
              :class="{ active: selectedDifficulty === d }"
              @click="selectedDifficulty = d"
            >
              {{ DIFFICULTY_LABELS[d] }}
            </button>
          </span>
        </h2>
        <table class="op-table">
          <thead>
            <tr>
              <th class="col-name">種類</th>
              <th>プレイ</th>
              <th>クリア</th>
              <th>正答率</th>
              <th>ベスト</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in byOperation"
              :key="row.operation"
              :class="{ unplayed: row.summary.playCount === 0 }"
            >
              <td class="col-name">{{ OPERATION_LABELS[row.operation] }}</td>
              <td>{{ row.summary.playCount }}</td>
              <td>{{ row.summary.clearCount }}</td>
              <td class="col-accuracy">
                {{ row.summary.accuracy !== null ? `${row.summary.accuracy}%` : '–' }}
              </td>
              <td class="col-best">
                {{ row.summary.bestScore !== null ? formatScore(row.summary.bestScore) : '–' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 履歴 -->
      <div class="rpg-card stats-section history-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 履歴
          <span v-if="statsStore.records.length > HISTORY_LIMIT" class="section-note"
            >最新{{ HISTORY_LIMIT }}件</span
          >
        </h2>
        <p v-if="history.length === 0" class="empty-note">まだ記録がありません</p>
        <ul v-else class="history-list">
          <li v-for="r in history" :key="r.id" class="history-row">
            <div class="history-main">
              <div class="history-mode">
                {{ DIFFICULTY_LABELS[r.difficulty] }} · {{ OPERATION_LABELS[r.operation] }} ·
                {{ r.questionCount }}問
              </div>
              <div class="history-date">{{ formatPlayedAt(r.playedAt) }}</div>
            </div>
            <div class="history-result">
              <div class="history-score">{{ formatScore(r.score) }}</div>
              <div class="history-time">
                {{ r.correctCount }} / {{ r.totalAnswered }} ·
                {{ formatElapsedTime(r.elapsedSeconds) }}
              </div>
            </div>
            <span class="history-badge" :class="r.endReason">
              {{ r.endReason === 'clear' ? 'クリア' : '失敗' }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-root {
  height: 100%;
  display: flex;
  justify-content: center;
  padding: max(1.5rem, env(safe-area-inset-top)) 1rem max(2rem, env(safe-area-inset-bottom));
}
.stats-inner {
  width: 100%;
  max-width: 380px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.stats-header {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}
.back-btn {
  position: absolute;
  left: 0;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-sub);
  font-size: 1.6rem;
  line-height: 1;
  padding-bottom: 4px;
  cursor: pointer;
}
.back-btn:active {
  background: rgba(255, 255, 255, 0.05);
}
.stats-title {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--gold-light);
}

.stats-section {
  padding: 0.8rem 1rem;
  flex-shrink: 0;
}
.section-label {
  margin-bottom: 0.6rem;
  min-height: 26px;
}
.section-note {
  margin-left: auto;
  font-weight: 500;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

/* 累計 */
.total-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.6fr;
  gap: 0.4rem;
}
.total-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px 2px 7px;
  text-align: center;
  min-width: 0;
}
.total-label {
  font-size: 0.62rem;
  color: var(--text-sub);
  letter-spacing: 0.06em;
}
.total-value {
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.total-value.accent {
  color: var(--gem-teal);
}
.total-unit {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-sub);
  margin-left: 1px;
}

/* 難易度・種類ごと */
.diff-tabs {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.diff-tab {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--text-sub);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.diff-tab.active {
  border-color: var(--gold);
  color: var(--gold-light);
  background: linear-gradient(135deg, #1c2b50, #162040);
}

.op-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.op-table th {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-sub);
  text-align: right;
  padding: 0 0 4px;
  white-space: nowrap;
}
.op-table td {
  font-size: 0.85rem;
  font-weight: 700;
  text-align: right;
  padding: 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.op-table .col-name {
  text-align: left;
  font-weight: 600;
  color: var(--text-main);
}
.op-table th.col-name {
  color: var(--text-sub);
}
.col-best {
  color: var(--gold-light);
}
.col-accuracy {
  color: var(--gem-teal);
}
.unplayed td {
  color: #4a5e85;
  font-weight: 500;
}

/* 履歴 */
.empty-note {
  text-align: center;
  color: var(--text-sub);
  font-size: 0.85rem;
  padding: 1rem 0;
}
/* The page itself never scrolls; only the history list does, inside its card */
.history-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.history-list {
  list-style: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.history-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.history-row:first-child {
  border-top: none;
  padding-top: 0;
}
.history-row:last-child {
  padding-bottom: 0;
}
.history-main {
  flex: 1;
  min-width: 0;
}
.history-mode {
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-date {
  font-size: 0.7rem;
  color: var(--text-sub);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
.history-result {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.history-score {
  font-size: 1rem;
  font-weight: 900;
  color: var(--gold-light);
}
.history-time {
  font-size: 0.7rem;
  color: var(--text-sub);
  margin-top: 1px;
}
.history-badge {
  flex-shrink: 0;
  width: 3.4rem;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 3px 0;
  border-radius: 99px;
  border: 1px solid;
}
.history-badge.clear {
  color: var(--success-text);
  border-color: rgba(var(--emerald-rgb), 0.5);
  background: rgba(var(--emerald-rgb), 0.12);
}
.history-badge.gameover {
  color: var(--danger-text);
  border-color: rgba(var(--ruby-rgb), 0.5);
  background: rgba(var(--ruby-rgb), 0.12);
}
</style>
