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

      <!-- 難易度・種類ごと -->
      <div class="rpg-card stats-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 種類ごと
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
                  {{ row.accuracy !== null ? `${row.accuracy}%` : '–' }}
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
  </SubScreen>
</template>

<style scoped>
/* 難易度・種類ごと */
.diff-tabs {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.diff-tab {
  font-size: 0.7rem;
  padding: 4px 10px;
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
