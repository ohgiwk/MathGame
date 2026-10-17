<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Difficulty, GameRecord, Operation } from '../types/game'
import { DIFFICULTIES, DIFFICULTY_LABELS, OPERATIONS, OPERATION_LABELS } from '../logic/labels'
import {
  type DayKey,
  type DaySummary,
  dayKey,
  toDayKey,
  summarizeByDay,
  summarizeDayByOperation,
  monthGrid,
  currentStreak,
} from '../logic/dailyStats'
import { formatScore, formatElapsedTime } from '../logic/format'

const props = defineProps<{ records: GameRecord[] }>()

/** How many play days the trend chart shows, newest last */
const CHART_DAYS = 14
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

const filter = ref<Difficulty | 'all'>('all')

const filtered = computed(() =>
  filter.value === 'all'
    ? props.records
    : props.records.filter((r) => r.difficulty === filter.value),
)
const days = computed(() => summarizeByDay(filtered.value))
const dayMap = computed(() => new Map(days.value.map((d) => [d.day, d])))
const streak = computed(() => currentStreak(new Set(dayMap.value.keys()), Date.now()))
const todayKey = dayKey(Date.now())

// ---- selection ----
const selectedDay = ref<DayKey | null>(null)
const selected = computed<DaySummary | null>(
  () => (selectedDay.value && dayMap.value.get(selectedDay.value)) || null,
)
// The day is shown operation by operation, each with its own average
const dayOperations = computed(() =>
  selectedDay.value ? summarizeDayByOperation(filtered.value, selectedDay.value) : [],
)

// keep a played day selected; fall back to the latest one when the filter drops it
watch(
  days,
  (list) => {
    if (!selectedDay.value || !dayMap.value.has(selectedDay.value)) {
      selectedDay.value = list.at(-1)?.day ?? null
    }
  },
  { immediate: true },
)

// ---- calendar ----
const now = new Date()
const initial = selectedDay.value ? parseDay(selectedDay.value) : null
const viewYear = ref(initial?.year ?? now.getFullYear())
const viewMonth = ref(initial?.month ?? now.getMonth())

function parseDay(key: DayKey) {
  const [y, m, d] = key.split('-').map(Number)
  return { year: y, month: m - 1, date: d }
}
function monthIndex(year: number, month: number) {
  return year * 12 + month
}
const viewIndex = computed(() => monthIndex(viewYear.value, viewMonth.value))
const canGoNext = computed(() => viewIndex.value < monthIndex(now.getFullYear(), now.getMonth()))
const canGoPrev = computed(() => {
  const first = days.value[0]
  if (!first) return false
  const { year, month } = parseDay(first.day)
  return viewIndex.value > monthIndex(year, month)
})
function shiftMonth(delta: number) {
  const i = viewIndex.value + delta
  viewYear.value = Math.floor(i / 12)
  viewMonth.value = i % 12
}

const weeks = computed(() =>
  monthGrid(viewYear.value, viewMonth.value).map((week) =>
    week.map((date) => {
      if (date === null) return null
      const key = toDayKey(viewYear.value, viewMonth.value, date)
      const summary = dayMap.value.get(key)
      const count = summary?.playCount ?? 0
      return {
        key,
        date,
        count,
        // 1 game / 2-3 games / 4 or more
        level: count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3,
      }
    }),
  ),
)
const monthPlayDays = computed(() => {
  const prefix = toDayKey(viewYear.value, viewMonth.value, 1).slice(0, 8)
  return days.value.filter((d) => d.day.startsWith(prefix)).length
})

function selectDay(key: DayKey) {
  if (!dayMap.value.has(key)) return
  selectedDay.value = key
  const { year, month } = parseDay(key)
  viewYear.value = year
  viewMonth.value = month
}

function formatDayHeading(key: DayKey) {
  const { year, month, date } = parseDay(key)
  const weekday = WEEKDAYS[new Date(year, month, date).getDay()]
  return `${month + 1}月${date}日（${weekday}）`
}
function formatShortDay(key: DayKey) {
  const { month, date } = parseDay(key)
  return `${month + 1}/${date}`
}

// ---- trend chart: one operation at a time ----
/** Each operation played under the filter, in the usual order so the buttons keep their places */
const chartOperations = computed(() => {
  const played = new Set(filtered.value.map((r) => r.operation))
  return OPERATIONS.filter((op) => played.has(op))
})
const chartOperation = ref<Operation | null>(null)
// fall back to the most recently played operation when the filter drops the charted one
watch(
  chartOperations,
  (list) => {
    if (!chartOperation.value || !list.includes(chartOperation.value)) {
      chartOperation.value = filtered.value[0]?.operation ?? null
    }
  },
  { immediate: true },
)

const W = 340
const H = 150
const PAD = { top: 26, right: 12, bottom: 20, left: 40 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const chartDays = computed(() =>
  summarizeByDay(filtered.value.filter((r) => r.operation === chartOperation.value)).slice(
    -CHART_DAYS,
  ),
)

/** A round ceiling for the y axis, e.g. 1,234 -> 1,500 */
function niceCeil(value: number): number {
  if (value <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * magnitude >= value) ?? 10
  return step * magnitude
}
const yMax = computed(() => niceCeil(Math.max(...chartDays.value.map((d) => d.averageScore), 0)))
const yTicks = computed(() => [0, yMax.value / 2, yMax.value])

const points = computed(() => {
  const list = chartDays.value
  const step = list.length > 1 ? plotW / (list.length - 1) : 0
  return list.map((d, i) => ({
    day: d.day,
    value: d.averageScore,
    x: PAD.left + (list.length > 1 ? i * step : plotW / 2),
    y: PAD.top + plotH * (1 - d.averageScore / yMax.value),
    // hit area spans halfway to each neighbour
    hitX: PAD.left + (list.length > 1 ? i * step - step / 2 : 0),
    hitW: list.length > 1 ? step : plotW,
  }))
})
const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '),
)
const areaPath = computed(() => {
  const pts = points.value
  if (pts.length < 2) return ''
  const base = PAD.top + plotH
  return `${linePath.value} L${pts.at(-1)!.x},${base} L${pts[0].x},${base} Z`
})
const selectedPoint = computed(() => points.value.find((p) => p.day === selectedDay.value) ?? null)
/** keeps the value bubble inside the chart near either edge */
const bubbleX = computed(() => {
  const p = selectedPoint.value
  if (!p) return 0
  return Math.min(Math.max(p.x, PAD.left + 34), W - PAD.right - 34)
})

/** Average of the newest half of the chart against the older half */
const trend = computed(() => {
  const list = chartDays.value
  if (list.length < 4) return null
  const half = Math.floor(list.length / 2)
  const avg = (xs: DaySummary[]) => xs.reduce((s, d) => s + d.averageScore, 0) / xs.length
  const older = avg(list.slice(0, half))
  const newer = avg(list.slice(-half))
  if (older === 0) return null
  return Math.round(((newer - older) / older) * 100)
})

function formatAxis(value: number) {
  return value >= 10000 ? `${value / 1000}k` : formatScore(value)
}
</script>

<template>
  <div class="growth">
    <!-- 難易度フィルタ -->
    <div class="filter-row">
      <button class="diff-tab" :class="{ active: filter === 'all' }" @click="filter = 'all'">
        すべて
      </button>
      <button
        v-for="d in DIFFICULTIES"
        :key="d"
        class="diff-tab"
        :class="{ active: filter === d }"
        @click="filter = d"
      >
        {{ DIFFICULTY_LABELS[d] }}
      </button>
    </div>

    <!-- カレンダー -->
    <div class="rpg-card stats-section">
      <h2 class="section-label">
        <span class="section-gem">◆</span> カレンダー
        <span class="section-note">
          <template v-if="streak > 0">連続 {{ streak }}日 · </template>合計 {{ days.length }}日
        </span>
      </h2>

      <div class="month-nav">
        <button
          class="month-btn"
          aria-label="前の月"
          :disabled="!canGoPrev"
          @click="shiftMonth(-1)"
        >
          ‹
        </button>
        <div class="month-title">
          {{ viewYear }}年{{ viewMonth + 1 }}月
          <span class="month-note">{{ monthPlayDays }}日プレイ</span>
        </div>
        <button class="month-btn" aria-label="次の月" :disabled="!canGoNext" @click="shiftMonth(1)">
          ›
        </button>
      </div>

      <div class="cal-grid cal-head">
        <div
          v-for="(w, i) in WEEKDAYS"
          :key="w"
          class="cal-weekday"
          :class="{ sun: i === 0, sat: i === 6 }"
        >
          {{ w }}
        </div>
      </div>
      <div v-for="(week, wi) in weeks" :key="wi" class="cal-grid">
        <template v-for="(cell, ci) in week" :key="ci">
          <div v-if="cell === null" class="cal-cell empty" />
          <button
            v-else
            class="cal-cell"
            :class="[
              `level-${cell.level}`,
              { today: cell.key === todayKey, selected: cell.key === selectedDay },
            ]"
            :disabled="cell.count === 0"
            :aria-label="`${cell.date}日 ${cell.count}回`"
            @click="selectDay(cell.key)"
          >
            {{ cell.date }}
          </button>
        </template>
      </div>
      <div class="cal-legend">
        <span>少</span>
        <span class="legend-swatch level-1" />
        <span class="legend-swatch level-2" />
        <span class="legend-swatch level-3" />
        <span>多</span>
      </div>
    </div>

    <!-- 選択した日 -->
    <div class="rpg-card stats-section">
      <p v-if="!selected" class="empty-note">まだ記録がありません</p>
      <template v-else>
        <h2 class="section-label">
          <span class="section-gem">◆</span> {{ formatDayHeading(selected.day) }}
          <span class="section-note">{{ selected.playCount }}回</span>
        </h2>
        <div v-for="k in dayOperations" :key="k.operation" class="kind-group">
          <!-- tapping an operation charts it below -->
          <button
            class="kind-head"
            :class="{ charted: k.operation === chartOperation }"
            @click="chartOperation = k.operation"
          >
            <span class="kind-name">{{ OPERATION_LABELS[k.operation] }}</span>
            <span
              v-if="k.previousAverage !== null"
              class="delta pill"
              :class="k.summary.averageScore > k.previousAverage ? 'pill-success' : 'delta-flat'"
            >
              前回より {{ k.summary.averageScore > k.previousAverage ? '+' : ''
              }}{{ formatScore(k.summary.averageScore - k.previousAverage) }}
            </span>
          </button>
          <div class="kind-stats">
            <span>{{ k.summary.playCount }}回</span>
            <span
              >平均 <b>{{ formatScore(k.summary.averageScore) }}</b></span
            >
            <span
              >ベスト <b>{{ formatScore(k.summary.bestScore ?? 0) }}</b></span
            >
          </div>
          <ol class="kind-records">
            <li v-for="r in k.records" :key="r.id" class="kind-record">
              <span class="rec-detail">
                {{ r.correctCount }} / {{ r.totalAnswered }} ·
                {{ formatElapsedTime(r.elapsedSeconds) }}
              </span>
              <span class="rec-score">{{ formatScore(r.score) }}</span>
            </li>
          </ol>
        </div>
      </template>
    </div>

    <!-- 平均スコアの推移 -->
    <div v-if="chartDays.length > 0" class="rpg-card stats-section">
      <h2 class="section-label">
        <span class="section-gem">◆</span> 平均スコアの推移
        <span class="section-note">
          直近{{ chartDays.length }}日
          <template v-if="trend !== null">
            ·
            <span :class="{ up: trend > 0 }">{{ trend > 0 ? '+' : '' }}{{ trend }}%</span>
          </template>
        </span>
      </h2>
      <div class="op-tabs" role="tablist" aria-label="グラフにする計算の種類">
        <button
          v-for="op in chartOperations"
          :key="op"
          role="tab"
          class="diff-tab op-tab"
          :class="{ active: chartOperation === op }"
          :aria-selected="chartOperation === op"
          @click="chartOperation = op"
        >
          {{ OPERATION_LABELS[op] }}
        </button>
      </div>
      <svg class="chart" :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="日ごとの平均スコア">
        <defs>
          <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.28" />
            <stop offset="100%" stop-color="var(--gold)" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- grid & y axis -->
        <g v-for="t in yTicks" :key="t">
          <line
            class="grid"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="PAD.top + plotH * (1 - t / yMax)"
            :y2="PAD.top + plotH * (1 - t / yMax)"
          />
          <text
            class="axis"
            :x="PAD.left - 6"
            :y="PAD.top + plotH * (1 - t / yMax) + 3"
            text-anchor="end"
          >
            {{ formatAxis(t) }}
          </text>
        </g>

        <!-- x axis: first and last day -->
        <text
          class="axis"
          :x="points[0].x"
          :y="H - 4"
          :text-anchor="points.length > 1 ? 'start' : 'middle'"
        >
          {{ formatShortDay(points[0].day) }}
        </text>
        <text
          v-if="points.length > 1"
          class="axis"
          :x="points.at(-1)!.x"
          :y="H - 4"
          text-anchor="end"
        >
          {{ formatShortDay(points.at(-1)!.day) }}
        </text>

        <!-- selected day guide -->
        <line
          v-if="selectedPoint"
          class="guide"
          :x1="selectedPoint.x"
          :x2="selectedPoint.x"
          :y1="PAD.top"
          :y2="PAD.top + plotH"
        />

        <path v-if="areaPath" :d="areaPath" fill="url(#growth-area)" />
        <path class="line" :d="linePath" />
        <circle
          v-for="p in points"
          :key="p.day"
          class="dot"
          :class="{ selected: p.day === selectedDay }"
          :cx="p.x"
          :cy="p.y"
          :r="p.day === selectedDay ? 5 : 3.5"
        />

        <!-- value of the selected day -->
        <g v-if="selectedPoint">
          <rect
            class="bubble"
            :x="bubbleX - 34"
            :y="Math.max(selectedPoint.y - 26, 2)"
            width="68"
            height="17"
            rx="8.5"
          />
          <text
            class="bubble-text"
            :x="bubbleX"
            :y="Math.max(selectedPoint.y - 26, 2) + 12"
            text-anchor="middle"
          >
            {{ formatShortDay(selectedPoint.day) }} {{ formatScore(selectedPoint.value) }}
          </text>
        </g>

        <!-- tap targets, larger than the dots -->
        <rect
          v-for="p in points"
          :key="`hit-${p.day}`"
          class="hit"
          :x="p.hitX"
          :y="0"
          :width="p.hitW"
          :height="H"
          @click="selectDay(p.day)"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.growth {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.stats-section {
  padding: 0.8rem 1rem;
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
.section-note .up {
  color: var(--success-text);
  font-weight: 700;
}
.empty-note {
  text-align: center;
  color: var(--text-sub);
  font-size: 0.85rem;
  padding: 1rem 0;
}

/* フィルタ */
.filter-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}
.diff-tab {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--text-sub);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.diff-tab.active {
  border-color: var(--gold);
  color: var(--gold-light);
  background: linear-gradient(135deg, var(--bg-selected), var(--bg-selected2));
}

/* カレンダー */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.month-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-sub);
  font-size: 1.3rem;
  line-height: 1;
  padding-bottom: 3px;
  cursor: pointer;
}
.month-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.month-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}
.month-note {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-sub);
  margin-left: 4px;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}
.cal-weekday {
  text-align: center;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--text-sub);
}
.cal-weekday.sun {
  color: var(--danger-text);
}
.cal-weekday.sat {
  color: var(--text-sat);
}
.cal-cell {
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgba(var(--wash-rgb), 0.03);
  color: var(--text-faint);
  font-size: 0.78rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.cal-cell.empty {
  background: transparent;
}
.cal-cell:disabled {
  cursor: default;
}
.level-1 {
  background: rgba(var(--gold-rgb), 0.18);
  color: var(--text-main);
}
.level-2 {
  background: rgba(var(--gold-rgb), 0.38);
  color: var(--gold-pale);
}
:root[data-theme='light'] .level-2 {
  color: var(--text-main);
}
.level-3 {
  background: rgba(var(--gold-rgb), 0.62);
  color: var(--gold-ink);
  font-weight: 800;
}
.cal-cell.today {
  border-color: var(--gem-teal);
}
.cal-cell.selected {
  border-color: var(--gold-light);
  box-shadow: 0 0 10px rgba(var(--gold-rgb), 0.5);
}
:root[data-theme='light'] .cal-cell.selected {
  border-color: var(--text-main);
  box-shadow: none;
}
.cal-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.6rem;
  color: var(--text-sub);
}
.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

/* 選択した日 */
.delta {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 0.66rem;
  padding: 2px 8px;
}
.delta-flat {
  border: 1px solid var(--border);
  color: var(--text-sub);
}
.kind-group {
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
}
.kind-group + .kind-group {
  margin-top: 0.6rem;
}
.kind-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}
.kind-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* a small mark beside the operation shown in the chart below */
.kind-head.charted .kind-name::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  vertical-align: middle;
  border-radius: 50%;
  background: var(--gold-light);
}
.kind-stats {
  display: flex;
  gap: 0.8rem;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.kind-stats b {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--gold-light);
}
.kind-records {
  list-style: none;
  margin-top: 0.3rem;
}
.kind-record {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  border-top: 1px solid rgba(var(--wash-rgb), 0.06);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.rec-detail {
  color: var(--text-sub);
}
.rec-score {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--gold-light);
}

/* one row however many operations there are: the buttons share the width */
.op-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 0.4rem;
}
.op-tab {
  flex: 1 1 0;
  min-width: 0;
  padding: 4px 0;
  font-size: 0.68rem;
  white-space: nowrap;
}

/* 推移グラフ */
.chart {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.grid {
  stroke: rgba(var(--wash-rgb), 0.07);
  stroke-width: 1;
}
.axis {
  fill: var(--text-sub);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}
.guide {
  stroke: rgba(var(--gold-rgb), 0.45);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.line {
  fill: none;
  stroke: var(--gold-light);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.dot {
  fill: var(--gold-light);
  stroke: var(--bg-card2);
  stroke-width: 2;
}
.dot.selected {
  fill: var(--gold-pale);
  stroke: var(--gold);
}
.bubble {
  fill: var(--bg-selected);
  stroke: var(--gold);
  stroke-width: 1;
}
.bubble-text {
  fill: var(--gold-light);
  font-size: 9.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hit {
  fill: transparent;
  cursor: pointer;
}
</style>
