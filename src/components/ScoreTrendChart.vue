<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Difficulty, GameRecord, Operation } from '../types/game'
import { DIFFICULTIES, DIFFICULTY_LABELS, OPERATIONS, OPERATION_LABELS } from '../logic/labels'
import { type DayKey, type DaySummary, summarizeByDay } from '../logic/dailyStats'
import { formatScore, formatShortDay } from '../logic/format'

const props = defineProps<{ records: GameRecord[] }>()

/** How many play days the chart shows, newest last */
const CHART_DAYS = 14

const filter = ref<Difficulty | 'all'>('all')

const filtered = computed(() =>
  filter.value === 'all'
    ? props.records
    : props.records.filter((r) => r.difficulty === filter.value),
)

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

// the day whose value the bubble shows; the latest one unless a dot is tapped
const selectedDay = ref<DayKey | null>(null)
watch(
  chartDays,
  (list) => {
    if (!list.some((d) => d.day === selectedDay.value)) {
      selectedDay.value = list.at(-1)?.day ?? null
    }
  },
  { immediate: true },
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
/** Where a score sits vertically in the plot */
function yFor(value: number) {
  return PAD.top + plotH * (1 - value / yMax.value)
}

const points = computed(() => {
  const list = chartDays.value
  const step = list.length > 1 ? plotW / (list.length - 1) : 0
  return list.map((d, i) => ({
    day: d.day,
    value: d.averageScore,
    x: PAD.left + (list.length > 1 ? i * step : plotW / 2),
    y: yFor(d.averageScore),
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
/** the bubble's top, above the dot but never off the top of the chart */
const bubbleY = computed(() => Math.max((selectedPoint.value?.y ?? 0) - 26, 2))

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
  <div v-if="records.length > 0" class="rpg-card stats-section">
    <h2 class="section-label">
      <span class="section-gem">◆</span> 平均スコアの推移
      <span v-if="chartDays.length > 0" class="section-note">
        直近{{ chartDays.length }}日
        <template v-if="trend !== null">
          ·
          <span :class="{ up: trend > 0 }">{{ trend > 0 ? '+' : '' }}{{ trend }}%</span>
        </template>
      </span>
    </h2>
    <div class="filter-row">
      <button
        class="chip filter-chip"
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        すべて
      </button>
      <button
        v-for="d in DIFFICULTIES"
        :key="d"
        class="chip filter-chip"
        :class="{ active: filter === d }"
        @click="filter = d"
      >
        {{ DIFFICULTY_LABELS[d] }}
      </button>
    </div>
    <div class="op-tabs" role="tablist" aria-label="グラフにする計算の種類">
      <button
        v-for="op in chartOperations"
        :key="op"
        role="tab"
        class="chip op-tab"
        :class="{ active: chartOperation === op }"
        :aria-selected="chartOperation === op"
        @click="chartOperation = op"
      >
        {{ OPERATION_LABELS[op] }}
      </button>
    </div>
    <p v-if="chartDays.length === 0" class="empty-note">まだ記録がありません</p>
    <svg v-else class="chart" :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="日ごとの平均スコア">
      <defs>
        <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--gold)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- grid & y axis -->
      <g v-for="t in yTicks" :key="t">
        <line class="grid" :x1="PAD.left" :x2="W - PAD.right" :y1="yFor(t)" :y2="yFor(t)" />
        <text class="axis" :x="PAD.left - 6" :y="yFor(t) + 3" text-anchor="end">
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
        <rect class="bubble" :x="bubbleX - 34" :y="bubbleY" width="68" height="17" rx="8.5" />
        <text class="bubble-text" :x="bubbleX" :y="bubbleY + 12" text-anchor="middle">
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
        @click="selectedDay = p.day"
      />
    </svg>
  </div>
</template>

<style scoped>
.section-note .up {
  color: var(--success-text);
  font-weight: 700;
}

/* フィルタ */
.filter-row {
  display: flex;
  gap: 6px;
  margin-bottom: 0.5rem;
}
.filter-chip {
  font-size: 0.72rem;
  padding: 5px 12px;
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
