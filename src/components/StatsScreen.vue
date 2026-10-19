<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useStatsStore } from '../stores/statsStore'
import type { QuestionCount } from '../types/game'
import type { DayKey } from '../logic/dailyStats'
import {
  QUESTION_COUNTS,
  DIFFICULTY_LABELS,
  OPERATION_LABELS,
  questionCountLabel,
} from '../logic/labels'
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

const selectedCount = ref<QuestionCount>(store.settings.questionCount)

const byOperation = computed(() =>
  bestByOperation(statsStore.records, selectedCount.value).map(({ operation, games, best }) => ({
    operation,
    games,
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

      <!-- ベストスコア: each operation's best game of the chosen length, at any difficulty, over
           a chart of its daily bests -->
      <div class="rpg-card stats-section">
        <h2 class="section-label"><span class="section-gem">◆</span> ベストスコア</h2>
        <div class="count-tabs" role="tablist" aria-label="問題数">
          <button
            v-for="c in QUESTION_COUNTS"
            :key="c"
            role="tab"
            class="chip count-tab"
            :class="{ active: selectedCount === c }"
            :aria-selected="selectedCount === c"
            :aria-label="questionCountLabel(c)"
            @click="selectedCount = c"
          >
            {{ c === 'endless' ? '∞' : `${c}問` }}
          </button>
        </div>
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
              {{ DIFFICULTY_LABELS[row.best.difficulty] }}
              <span class="detail-sep">·</span>
              正答率
              <span class="detail-accuracy">{{
                row.accuracy !== null ? `${row.accuracy}%` : '–'
              }}</span>
              <span class="detail-sep">·</span>
              <!-- an endless game has no set count, so it shows how many were answered -->
              <template v-if="row.best.questionCount === 'endless'">
                {{ row.best.totalAnswered }}問
                <span class="detail-sep">·</span>
              </template>
              {{ formatElapsedTime(row.best.elapsedSeconds) }}
            </span>
            <span v-else class="best-detail">まだ記録がありません</span>
            <ScoreTrendChart v-if="row.best" class="best-chart" :records="row.games" />
          </li>
        </ul>
      </div>
    </template>
  </SubScreen>
</template>

<style scoped>
/* ベストスコア */
.count-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin-bottom: 0.3rem;
}
.count-tab {
  font-size: 0.72rem;
  padding: 5px 0;
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
    'detail score'
    'chart chart';
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
.best-chart {
  grid-area: chart;
  margin-top: 0.4rem;
}
/* a flex row, so the separators alone set the spacing, whatever whitespace the template has */
.best-detail {
  grid-area: detail;
  display: flex;
  align-items: baseline;
  margin-top: 2px;
  font-size: 0.68rem;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.detail-accuracy {
  margin-left: 3px;
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
