<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GameRecord } from '../types/game'
import { DIFFICULTY_LABELS, operationLabel, questionCountLabel } from '../logic/labels'
import { type DayKey, dayKey, summarizeByDay } from '../logic/dailyStats'
import { formatScore, formatElapsedTime, formatTotalTime, formatDayHeading } from '../logic/format'
import { summarize } from '../logic/statsCalculator'

const props = defineProps<{
  /** Newest first */
  records: GameRecord[]
  /** The day to narrow the history to, e.g. one tapped in the records tab's calendar */
  initialDay?: DayKey | null
}>()

/** A day with more games than this shows only the newest ones until it is opened */
const DAY_PREVIEW = 5

const total = computed(() => summarize(props.records))

// ---- date filter: every day unless one is picked ----
const days = computed(() => summarizeByDay(props.records))
/** The played days to pick from, newest first */
const dayOptions = computed(() => days.value.slice().reverse())
const dayFilter = ref<DayKey | null>(props.initialDay ?? null)
// drop a filter whose day no longer has any games
watch(
  days,
  (list) => {
    if (dayFilter.value && !list.some((d) => d.day === dayFilter.value)) dayFilter.value = null
  },
  { immediate: true },
)

// ---- history: one panel per day, newest first ----
const dayGroups = computed(() => {
  const groups: { day: DayKey; records: GameRecord[] }[] = []
  for (const r of props.records) {
    const day = dayKey(r.playedAt)
    if (dayFilter.value && day !== dayFilter.value) continue
    const last = groups.at(-1)
    if (last?.day === day) last.records.push(r)
    else groups.push({ day, records: [r] })
  }
  return groups
})
const openDays = ref(new Set<DayKey>())
function toggleDay(day: DayKey) {
  if (!openDays.value.delete(day)) openDays.value.add(day)
}
</script>

<template>
  <div class="history-view">
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
          <div class="total-value">{{ total.clearCount }}<span class="total-unit">回</span></div>
        </div>
        <div class="tile total-item">
          <div class="total-label">累計スコア</div>
          <div class="total-value">{{ formatScore(total.totalScore) }}</div>
        </div>
      </div>
    </div>

    <!-- 履歴の見出しと日付の絞り込み -->
    <div class="history-head">
      <h2 class="section-label history-title"><span class="section-gem">◆</span> 履歴</h2>
      <template v-if="days.length > 0">
        <select v-model="dayFilter" class="day-select" aria-label="日付で絞り込み">
          <option :value="null">すべての日</option>
          <option v-for="d in dayOptions" :key="d.day" :value="d.day">
            {{ formatDayHeading(d.day) }} · {{ d.playCount }}回
          </option>
        </select>
        <button
          v-if="dayFilter"
          class="day-clear"
          aria-label="絞り込みを解除"
          @click="dayFilter = null"
        >
          ×
        </button>
      </template>
    </div>

    <!-- 履歴: 日付ごと -->
    <div v-if="dayGroups.length === 0" class="rpg-card stats-section">
      <p class="empty-note">まだ記録がありません</p>
    </div>
    <div v-for="g in dayGroups" :key="g.day" class="rpg-card stats-section">
      <h2 class="section-label">
        <span class="section-gem">◆</span> {{ formatDayHeading(g.day) }}
        <span class="section-note">{{ g.records.length }}回</span>
      </h2>
      <ul class="history-list">
        <li
          v-for="r in openDays.has(g.day) ? g.records : g.records.slice(0, DAY_PREVIEW)"
          :key="r.id"
          class="history-row"
        >
          <div class="history-main">
            <div class="history-mode">
              {{ DIFFICULTY_LABELS[r.difficulty] }} ·
              {{ operationLabel(r.operation, r.mixedOperations) }} ·
              {{ questionCountLabel(r.questionCount) }}
            </div>
          </div>
          <div class="history-result">
            <div class="history-score">{{ formatScore(r.score) }}</div>
            <div class="history-time">
              {{ r.correctCount }} / {{ r.totalAnswered }} ·
              {{ formatElapsedTime(r.elapsedSeconds) }}
            </div>
          </div>
          <span
            class="history-badge pill"
            :class="
              r.questionCount === 'endless'
                ? 'pill-endless'
                : r.endReason === 'clear'
                  ? 'pill-success'
                  : 'pill-danger'
            "
          >
            {{ r.questionCount === 'endless' ? '∞' : r.endReason === 'clear' ? 'クリア' : '失敗' }}
          </span>
        </li>
      </ul>
      <button
        v-if="g.records.length > DAY_PREVIEW"
        class="history-toggle"
        :aria-expanded="openDays.has(g.day)"
        @click="toggleDay(g.day)"
      >
        {{ openDays.has(g.day) ? '閉じる' : `すべて見る（${g.records.length}件）` }}
        <span class="toggle-arrow" :class="{ open: openDays.has(g.day) }">▾</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
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

/* 履歴の見出しと日付の絞り込み */
.history-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  padding: 0 0.25rem;
}
.history-title {
  margin: 0 auto 0 0;
  min-height: 0;
}
.day-select {
  min-width: 0;
  height: 34px;
  padding: 0 0.7rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-inset);
  color: var(--text-main);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.day-clear {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-sub);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

/* 履歴 */
.history-list {
  list-style: none;
}
.history-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  margin-top: 0.6rem;
  padding: 6px 0;
  border: 1px solid var(--border);
  border-radius: 99px;
  background: transparent;
  color: var(--text-sub);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
}
.toggle-arrow {
  transition: transform 0.2s ease;
}
.toggle-arrow.open {
  transform: rotate(180deg);
}
.history-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(var(--wash-rgb), 0.06);
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
/* an endless game has no clear or failure; it just ends */
.pill-endless {
  --pill-rgb: var(--gold-rgb);
  color: var(--gold-light);
}
.history-badge {
  flex-shrink: 0;
  width: 3.4rem;
  text-align: center;
  font-size: 0.68rem;
  padding: 3px 0;
}
</style>
