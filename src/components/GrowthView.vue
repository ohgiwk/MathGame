<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Difficulty, GameRecord } from '../types/game'
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../logic/labels'
import {
  type DayKey,
  type DaySummary,
  dayKey,
  toDayKey,
  summarizeByDay,
  monthGrid,
  currentStreak,
} from '../logic/dailyStats'
import { formatScore } from '../logic/format'

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
/** The play day before the selected one, to compare against */
const previous = computed<DaySummary | null>(() => {
  const i = days.value.findIndex((d) => d.day === selectedDay.value)
  return i > 0 ? days.value[i - 1] : null
})
const scoreDelta = computed(() =>
  selected.value && previous.value
    ? selected.value.averageScore - previous.value.averageScore
    : null,
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

// ---- trend chart ----
const W = 340
const H = 150
const PAD = { top: 26, right: 12, bottom: 20, left: 40 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const chartDays = computed(() => days.value.slice(-CHART_DAYS))

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
          <span
            v-if="scoreDelta !== null"
            class="delta pill"
            :class="scoreDelta > 0 ? 'pill-success' : 'delta-flat'"
          >
            前回より {{ scoreDelta > 0 ? '+' : '' }}{{ formatScore(scoreDelta) }}
          </span>
        </h2>
        <div class="day-row">
          <div class="tile day-item">
            <div class="day-label">プレイ</div>
            <div class="day-value">{{ selected.playCount }}<span class="day-unit">回</span></div>
          </div>
          <div class="tile day-item">
            <div class="day-label">平均スコア</div>
            <div class="day-value">{{ formatScore(selected.averageScore) }}</div>
          </div>
          <div class="tile day-item">
            <div class="day-label">ベスト</div>
            <div class="day-value">{{ formatScore(selected.bestScore ?? 0) }}</div>
          </div>
          <div class="tile day-item">
            <div class="day-label">正答率</div>
            <div class="day-value accent">
              {{ selected.accuracy ?? '–'
              }}<span v-if="selected.accuracy !== null" class="day-unit">%</span>
            </div>
          </div>
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
  background: linear-gradient(135deg, #1c2b50, #162040);
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
  color: #8fb0ff;
}
.cal-cell {
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: #4a5e85;
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
  color: #fff4d0;
}
.level-3 {
  background: rgba(var(--gold-rgb), 0.62);
  color: #1a1406;
  font-weight: 800;
}
.cal-cell.today {
  border-color: var(--gem-teal);
}
.cal-cell.selected {
  border-color: var(--gold-light);
  box-shadow: 0 0 10px rgba(var(--gold-rgb), 0.5);
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
  margin-left: auto;
  font-size: 0.66rem;
  padding: 2px 8px;
}
.delta-flat {
  border: 1px solid var(--border);
  color: var(--text-sub);
}
.day-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.4fr 1fr;
  gap: 0.4rem;
}
.day-item {
  border-radius: 10px;
  padding: 6px 2px 7px;
  min-width: 0;
}
.day-label {
  font-size: 0.62rem;
  color: var(--text-sub);
  letter-spacing: 0.06em;
}
.day-value {
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.day-value.accent {
  color: var(--gem-teal);
}
.day-unit {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-sub);
  margin-left: 1px;
}

/* 推移グラフ */
.chart {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.grid {
  stroke: rgba(255, 255, 255, 0.07);
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
  fill: #fff4d0;
  stroke: var(--gold);
}
.bubble {
  fill: #1c2b50;
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
