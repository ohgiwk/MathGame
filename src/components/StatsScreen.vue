<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useStatsStore } from '../stores/statsStore'
import type { Difficulty } from '../types/game'
import type { DayKey } from '../logic/dailyStats'
import { DIFFICULTIES, DIFFICULTY_LABELS, OPERATION_LABELS } from '../logic/labels'
import { summarize, bestByOperation } from '../logic/statsCalculator'
import { formatScore, formatElapsedTime, formatTotalTime } from '../logic/format'
import HistoryView from './HistoryView.vue'
import PlayCalendar from './PlayCalendar.vue'
import ScoreTrendChart from './ScoreTrendChart.vue'

const store = useGameStore()
const statsStore = useStatsStore()

const view = ref<'records' | 'history'>('records')
/** The day the history tab is narrowed to; only set when it is opened from the calendar */
const historyDay = ref<DayKey | null>(null)

function openTab(tab: 'records' | 'history') {
  historyDay.value = null
  view.value = tab
}
function openDay(day: DayKey) {
  historyDay.value = day
  view.value = 'history'
}

const selectedDifficulty = ref<Difficulty>(store.settings.difficulty)

const total = computed(() => summarize(statsStore.records))
const byOperation = computed(() => bestByOperation(statsStore.records, selectedDifficulty.value))
</script>

<template>
  <div class="stats-root">
    <div class="stats-inner fade-in-up">
      <!-- Header -->
      <div class="stats-header">
        <button class="back-btn" aria-label="ホームに戻る" @click="store.goHome()">‹</button>
        <h1 class="stats-title">My Records</h1>
      </div>

      <div class="view-tabs" role="tablist">
        <button
          role="tab"
          class="view-tab"
          :class="{ active: view === 'records' }"
          :aria-selected="view === 'records'"
          @click="openTab('records')"
        >
          記録
        </button>
        <button
          role="tab"
          class="view-tab"
          :class="{ active: view === 'history' }"
          :aria-selected="view === 'history'"
          @click="openTab('history')"
        >
          履歴
        </button>
      </div>

      <HistoryView
        v-if="view === 'history'"
        :records="statsStore.records"
        :initial-day="historyDay"
      />

      <template v-else>
        <PlayCalendar :records="statsStore.records" @select="openDay" />
        <ScoreTrendChart :records="statsStore.records" />

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
            <div class="tile total-item">
              <div class="total-label">クリア</div>
              <div class="total-value">
                {{ total.clearCount }}<span class="total-unit">回</span>
              </div>
            </div>
            <div class="tile total-item">
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
                <th>ベスト</th>
                <th>正答率</th>
                <th>問題数</th>
                <th>時間</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in byOperation" :key="row.operation" :class="{ unplayed: !row.best }">
                <td class="col-name">{{ OPERATION_LABELS[row.operation] }}</td>
                <template v-if="row.best">
                  <td class="col-best">{{ formatScore(row.best.score) }}</td>
                  <td class="col-accuracy">
                    {{
                      row.best.totalAnswered > 0
                        ? `${Math.round((row.best.correctCount / row.best.totalAnswered) * 100)}%`
                        : '–'
                    }}
                  </td>
                  <!-- an endless game has no set count, so it shows how many were answered -->
                  <td>
                    {{
                      row.best.questionCount === 'endless'
                        ? `∞ ${row.best.totalAnswered}`
                        : `${row.best.questionCount}問`
                    }}
                  </td>
                  <td>{{ formatElapsedTime(row.best.elapsedSeconds) }}</td>
                </template>
                <template v-else><td v-for="i in 4" :key="i">–</td></template>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.stats-root {
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding: max(1.5rem, env(safe-area-inset-top)) 1rem max(2rem, env(safe-area-inset-bottom));
}
.stats-inner {
  width: 100%;
  max-width: 380px;
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
  padding: 0.6rem 0 0.9rem;
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
  background: rgba(var(--wash-rgb), 0.05);
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

/* 記録 / 履歴 */
.view-tabs {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-inset);
}
.view-tab {
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--text-sub);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 7px 0;
  cursor: pointer;
  transition: all 0.15s ease;
}
.view-tab.active {
  border-color: var(--gold);
  color: var(--gold-light);
  background: linear-gradient(135deg, var(--bg-selected), var(--bg-selected2));
  box-shadow: 0 0 10px rgba(var(--gold-rgb), 0.2);
}

/* 累計 */
.total-row {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 0.4rem;
}
.total-item {
  border-radius: 10px;
  padding: 6px 2px 7px;
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
  background: linear-gradient(135deg, var(--bg-selected), var(--bg-selected2));
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
  font-size: 0.8rem;
  font-weight: 700;
  text-align: right;
  padding: 6px 0 6px 0.5rem;
  white-space: nowrap;
  border-top: 1px solid rgba(var(--wash-rgb), 0.06);
}
.op-table .col-name {
  text-align: left;
  padding-left: 0;
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
  color: var(--text-faint);
  font-weight: 500;
}
</style>
