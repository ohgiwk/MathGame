<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useStatsStore } from '../stores/statsStore'
import type { Difficulty } from '../types/game'
import type { DayKey } from '../logic/dailyStats'
import { DIFFICULTIES, DIFFICULTY_LABELS, OPERATION_LABELS } from '../logic/labels'
import { accuracyPercent, bestByOperation } from '../logic/statsCalculator'
import { formatScore, formatElapsedTime } from '../logic/format'
import HistoryView from './HistoryView.vue'
import PlayCalendar from './PlayCalendar.vue'
import ScoreTrendChart from './ScoreTrendChart.vue'
import SubScreen from './SubScreen.vue'

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

const byOperation = computed(() =>
  bestByOperation(statsStore.records, selectedDifficulty.value).map(({ operation, best }) => ({
    operation,
    best,
    accuracy: best ? accuracyPercent(best.correctCount, best.totalAnswered) : null,
  })),
)
</script>

<template>
  <SubScreen title="My Records">
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

      <!-- ベストスコア: each operation's best game at the chosen difficulty -->
      <div class="rpg-card stats-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> ベストスコア
          <span class="diff-tabs">
            <button
              v-for="d in DIFFICULTIES"
              :key="d"
              class="chip diff-tab"
              :class="{ active: selectedDifficulty === d }"
              @click="selectedDifficulty = d"
            >
              {{ DIFFICULTY_LABELS[d] }}
            </button>
          </span>
        </h2>
        <ul class="best-list">
          <li
            v-for="row in byOperation"
            :key="row.operation"
            class="best-row"
            :class="{ unplayed: !row.best }"
          >
            <span class="best-name">{{ OPERATION_LABELS[row.operation] }}</span>
            <span class="best-score">{{ row.best ? formatScore(row.best.score) : '–' }}</span>
            <!-- the details of the game that set the best -->
            <span v-if="row.best" class="best-detail">
              正答率
              <span class="detail-accuracy">{{
                row.accuracy !== null ? `${row.accuracy}%` : '–'
              }}</span>
              <span class="detail-sep">·</span>
              <!-- an endless game has no set count, so it shows how many were answered -->
              {{
                row.best.questionCount === 'endless'
                  ? `∞ ${row.best.totalAnswered}問`
                  : `${row.best.questionCount}問`
              }}
              <span class="detail-sep">·</span>
              {{ formatElapsedTime(row.best.elapsedSeconds) }}
            </span>
            <span v-else class="best-detail">まだ記録がありません</span>
          </li>
        </ul>
      </div>
    </template>
  </SubScreen>
</template>

<style scoped>
/* ベストスコア */
.diff-tabs {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.diff-tab {
  font-size: 0.7rem;
  padding: 4px 10px;
}

.best-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
/* the name over its details on the left, the score large on the right */
.best-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'name score'
    'detail score';
  align-items: center;
  column-gap: 0.8rem;
  padding: 8px 0;
  border-top: 1px solid rgba(var(--wash-rgb), 0.06);
}
.best-row:first-child {
  border-top: none;
}
.best-name {
  grid-area: name;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-main);
}
.best-detail {
  grid-area: detail;
  margin-top: 2px;
  font-size: 0.68rem;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.detail-accuracy {
  color: var(--gem-teal);
  font-weight: 700;
}
.detail-sep {
  margin: 0 4px;
}
.best-score {
  grid-area: score;
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1.1;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
}
.unplayed .best-name,
.unplayed .best-score {
  color: var(--text-faint);
}
.unplayed .best-score {
  font-size: 1.2rem;
  font-weight: 600;
}
</style>
