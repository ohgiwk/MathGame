<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HundredOperation, HundredRecord } from '../types/game'
import { useHundredStore } from '../stores/hundredStore'
import { HUNDRED_OPERATIONS, CELL_COUNT, formatLapTime } from '../logic/hundredGrid'
import { bestRecordIds, isPerfect, missCount, summarizeHundred } from '../logic/hundredRecords'
import { OPERATION_LABELS, OPERATION_BUTTON_SYMBOLS } from '../logic/labels'
import { type DayKey, dayKey } from '../logic/dailyStats'
import { formatDayHeading, formatTotalTime } from '../logic/format'
import SubScreen from './SubScreen.vue'
import LevelBar from './LevelBar.vue'

const hundred = useHundredStore()

/** A day with more games than this shows only the newest ones until it is opened */
const DAY_PREVIEW = 5

const total = computed(() => summarizeHundred(hundred.records))
const bestIds = computed(() => bestRecordIds(hundred.records))

const bestRows = computed(() =>
  HUNDRED_OPERATIONS.map((operation) => ({
    operation,
    best: hundred.bestRecords[operation],
    plays: hundred.records.filter((r) => r.operation === operation).length,
  })),
)

// ---- history: narrowed to one operation if picked, one panel per day, newest first ----
const operationFilter = ref<HundredOperation | null>(null)
const dayGroups = computed(() => {
  const groups: { day: DayKey; records: HundredRecord[] }[] = []
  for (const r of hundred.records) {
    if (operationFilter.value && r.operation !== operationFilter.value) continue
    const day = dayKey(r.playedAt)
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

/** e.g. '9:05' */
function timeOfDay(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <SubScreen title="My Records">
    <!-- レベル -->
    <div class="rpg-card stats-section">
      <h2 class="section-label"><span class="section-gem">◆</span> 百ます計算 · レベル</h2>
      <LevelBar :progress="hundred.level" />
    </div>

    <!-- ベストタイム -->
    <div class="rpg-card stats-section">
      <h2 class="section-label"><span class="section-gem">◆</span> 百ます計算 · ベストタイム</h2>
      <ul class="best-list">
        <li
          v-for="row in bestRows"
          :key="row.operation"
          class="best-row"
          :class="{ unplayed: row.best === undefined }"
        >
          <span class="best-name">{{ OPERATION_LABELS[row.operation] }}</span>
          <span class="best-detail">
            <template v-if="row.best"
              ><span class="best-misses">ミス回数：{{ missCount(row.best) }}</span> · </template
            >{{ row.plays > 0 ? `${row.plays}回プレイ` : 'まだ記録がありません' }}
          </span>
          <span class="best-time">{{
            row.best !== undefined ? formatLapTime(row.best.elapsedMs) : '–'
          }}</span>
        </li>
      </ul>
    </div>

    <!-- 累計 -->
    <div class="rpg-card stats-section">
      <h2 class="section-label">
        <span class="section-gem">◆</span> 累計
        <span class="section-note">{{ formatTotalTime(total.totalMs / 1000) }}</span>
      </h2>
      <div class="total-row">
        <div class="tile total-item">
          <div class="total-label">プレイ</div>
          <div class="total-value">{{ total.playCount }}<span class="total-unit">回</span></div>
        </div>
        <div class="tile total-item">
          <div class="total-label">全問正解</div>
          <div class="total-value">{{ total.perfectCount }}<span class="total-unit">回</span></div>
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

    <!-- 履歴 -->
    <div class="history-head">
      <h2 class="section-label history-title"><span class="section-gem">◆</span> 履歴</h2>
      <div class="op-filter" role="tablist" aria-label="計算の種類で絞り込み">
        <button
          role="tab"
          class="chip op-chip"
          :class="{ active: operationFilter === null }"
          :aria-selected="operationFilter === null"
          @click="operationFilter = null"
        >
          すべて
        </button>
        <button
          v-for="op in HUNDRED_OPERATIONS"
          :key="op"
          role="tab"
          class="chip op-chip"
          :class="{ active: operationFilter === op }"
          :aria-selected="operationFilter === op"
          :aria-label="OPERATION_LABELS[op]"
          @click="operationFilter = op"
        >
          {{ OPERATION_BUTTON_SYMBOLS[op] }}
        </button>
      </div>
    </div>

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
            <div class="history-mode">{{ OPERATION_LABELS[r.operation] }}</div>
            <div class="history-sub">{{ timeOfDay(r.playedAt) }}</div>
          </div>
          <div class="history-result">
            <div class="history-time">
              <span v-if="bestIds.has(r.id)" class="crown" aria-label="ベストタイム">👑</span>
              {{ formatLapTime(r.elapsedMs) }}
            </div>
            <div class="history-sub">{{ r.correctCount }} / {{ CELL_COUNT }}</div>
          </div>
          <span class="history-badge pill" :class="isPerfect(r) ? 'pill-success' : 'pill-danger'">
            {{ isPerfect(r) ? '全問正解' : `ミス${CELL_COUNT - r.correctCount}` }}
          </span>
        </li>
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
  </SubScreen>
</template>

<style scoped>
/* ベストタイム */
.best-list {
  list-style: none;
}
.best-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'name time'
    'detail time';
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
}
.best-misses {
  font-weight: 700;
  color: var(--danger-text);
}
.best-time {
  grid-area: time;
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1.1;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
}
.unplayed .best-name,
.unplayed .best-time {
  color: var(--text-faint);
}
.unplayed .best-time {
  font-size: 1.2rem;
  font-weight: 600;
}

/* 累計 */
.total-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

/* 履歴の見出しと絞り込み */
.history-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  padding: 0 0.25rem;
}
.history-title {
  margin: 0 auto 0 0;
}
.op-filter {
  display: flex;
  gap: 4px;
}
.op-chip {
  min-width: 2.2rem;
  padding: 4px 8px;
  font-size: 0.75rem;
}

/* 履歴 */
.history-list {
  list-style: none;
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
}
.history-sub {
  font-size: 0.7rem;
  color: var(--text-sub);
  margin-top: 1px;
  font-variant-numeric: tabular-nums;
}
.history-result {
  text-align: right;
}
.history-time {
  font-size: 1rem;
  font-weight: 900;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
}
.crown {
  font-size: 0.8rem;
  margin-right: 2px;
}
.history-badge {
  flex-shrink: 0;
  width: 4.2rem;
  text-align: center;
  font-size: 0.66rem;
  padding: 3px 0;
}
.toggle-arrow {
  transition: transform 0.2s ease;
}
.toggle-arrow.open {
  transform: rotate(180deg);
}
</style>
