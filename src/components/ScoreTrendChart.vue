<script lang="ts">
/** Numbers each chart's gradient, since several charts share the page */
let nextChartId = 0
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GameRecord } from '../types/game'
import { type DayKey, type DaySummary, summarizeByDay } from '../logic/dailyStats'
import { formatScore, formatShortDay } from '../logic/format'

/** The games to chart, already narrowed to one kind; each day plots its best score */
const props = defineProps<{ records: GameRecord[] }>()

/** How many play days the chart shows, newest last */
const CHART_DAYS = 14

const gradientId = `trend-area-${nextChartId++}`

const W = 320
const H = 92
const PAD = { top: 24, right: 10, bottom: 16, left: 34 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const chartDays = computed(() => summarizeByDay(props.records).slice(-CHART_DAYS))
/** The day's best score, the value charted; every summarized day has at least one game */
function dayBest(d: DaySummary): number {
  return d.bestScore ?? 0
}

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
const yMax = computed(() => niceCeil(Math.max(...chartDays.value.map(dayBest), 0)))
const yTicks = computed(() => [0, yMax.value])
/** Where a score sits vertically in the plot */
function yFor(value: number) {
  return PAD.top + plotH * (1 - value / yMax.value)
}

const points = computed(() => {
  const list = chartDays.value
  const step = list.length > 1 ? plotW / (list.length - 1) : 0
  return list.map((d, i) => ({
    day: d.day,
    value: dayBest(d),
    x: PAD.left + (list.length > 1 ? i * step : plotW / 2),
    y: yFor(dayBest(d)),
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
const bubbleY = computed(() => Math.max((selectedPoint.value?.y ?? 0) - 24, 1))

function formatAxis(value: number) {
  return value >= 10000 ? `${value / 1000}k` : formatScore(value)
}
</script>

<template>
  <svg
    v-if="points.length > 0"
    class="chart"
    :viewBox="`0 0 ${W} ${H}`"
    role="img"
    aria-label="日ごとの最高スコアの推移"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
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
      :y="H - 3"
      :text-anchor="points.length > 1 ? 'start' : 'middle'"
    >
      {{ formatShortDay(points[0].day) }}
    </text>
    <text v-if="points.length > 1" class="axis" :x="points.at(-1)!.x" :y="H - 3" text-anchor="end">
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

    <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" />
    <path class="line" :d="linePath" />
    <circle
      v-for="p in points"
      :key="p.day"
      class="dot"
      :class="{ selected: p.day === selectedDay }"
      :cx="p.x"
      :cy="p.y"
      :r="p.day === selectedDay ? 4.5 : 3"
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
</template>

<style scoped>
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
