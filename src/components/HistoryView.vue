<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GameRecord } from '../types/game'
import { type DayKey, dayKey, summarizeByDay } from '../logic/dailyStats'
import { formatTotalTime, formatDayHeading } from '../logic/format'
import { summarize } from '../logic/statsCalculator'
import HistoryRow from './HistoryRow.vue'

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
          <div class="total-label">正答率</div>
          <div class="total-value">
            {{ total.accuracy ?? '–'
            }}<span v-if="total.accuracy !== null" class="total-unit">%</span>
          </div>
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
        <HistoryRow
          v-for="r in openDays.has(g.day) ? g.records : g.records.slice(0, DAY_PREVIEW)"
          :key="r.id"
          :record="r"
        />
      </ul>
      <button
        v-if="g.records.length > DAY_PREVIEW"
        class="more-btn"
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
  grid-template-columns: 1fr 1fr;
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
.toggle-arrow {
  transition: transform 0.2s ease;
}
.toggle-arrow.open {
  transform: rotate(180deg);
}
</style>
