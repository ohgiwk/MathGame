<script lang="ts">
/** Numbers each chart's gradient, since several charts share the page */
let nextChartId = 0

/** One value on the chart, oldest first */
export interface TrendPoint {
  key: string
  value: number
  /** names the point on the x axis and in the bubble, e.g. '10/22' */
  label: string
}
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  points: TrendPoint[]
  /** the value in the bubble */
  formatValue: (value: number) => string
  /** a y axis tick */
  formatAxis: (value: number) => string
  /** what the chart shows, read out in place of the drawing */
  label: string
}>()

const gradientId = `trend-area-${nextChartId++}`

const W = 320
const H = 92
const PAD = { top: 24, right: 10, bottom: 16, left: 34 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

// the point whose value the bubble shows; the latest one unless a dot is tapped
const selectedKey = ref<string | null>(null)
watch(
  () => props.points,
  (list) => {
    if (!list.some((p) => p.key === selectedKey.value)) {
      selectedKey.value = list.at(-1)?.key ?? null
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
const yMax = computed(() => niceCeil(Math.max(...props.points.map((p) => p.value), 0)))
const yTicks = computed(() => [0, yMax.value])
/** Where a value sits vertically in the plot */
function yFor(value: number) {
  return PAD.top + plotH * (1 - value / yMax.value)
}

const placed = computed(() => {
  const list = props.points
  const step = list.length > 1 ? plotW / (list.length - 1) : 0
  return list.map((p, i) => ({
    ...p,
    x: PAD.left + (list.length > 1 ? i * step : plotW / 2),
    y: yFor(p.value),
    // hit area spans halfway to each neighbour
    hitX: PAD.left + (list.length > 1 ? i * step - step / 2 : 0),
    hitW: list.length > 1 ? step : plotW,
  }))
})
const linePath = computed(() =>
  placed.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '),
)
const areaPath = computed(() => {
  const pts = placed.value
  if (pts.length < 2) return ''
  const base = PAD.top + plotH
  return `${linePath.value} L${pts.at(-1)!.x},${base} L${pts[0].x},${base} Z`
})
const selectedPoint = computed(() => placed.value.find((p) => p.key === selectedKey.value) ?? null)
/** keeps the value bubble inside the chart near either edge */
const bubbleX = computed(() => {
  const p = selectedPoint.value
  if (!p) return 0
  return Math.min(Math.max(p.x, PAD.left + 34), W - PAD.right - 34)
})
/** the bubble's top, above the dot but never off the top of the chart */
const bubbleY = computed(() => Math.max((selectedPoint.value?.y ?? 0) - 24, 1))
</script>

<template>
  <svg
    v-if="placed.length > 0"
    class="chart"
    :viewBox="`0 0 ${W} ${H}`"
    role="img"
    :aria-label="label"
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

    <!-- x axis: first and last point -->
    <text
      class="axis"
      :x="placed[0].x"
      :y="H - 3"
      :text-anchor="placed.length > 1 ? 'start' : 'middle'"
    >
      {{ placed[0].label }}
    </text>
    <text v-if="placed.length > 1" class="axis" :x="placed.at(-1)!.x" :y="H - 3" text-anchor="end">
      {{ placed.at(-1)!.label }}
    </text>

    <!-- selected point guide -->
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
      v-for="p in placed"
      :key="p.key"
      class="dot"
      :class="{ selected: p.key === selectedKey }"
      :cx="p.x"
      :cy="p.y"
      :r="p.key === selectedKey ? 4.5 : 3"
    />

    <!-- value of the selected point -->
    <g v-if="selectedPoint">
      <rect class="bubble" :x="bubbleX - 34" :y="bubbleY" width="68" height="17" rx="8.5" />
      <text class="bubble-text" :x="bubbleX" :y="bubbleY + 12" text-anchor="middle">
        {{ selectedPoint.label }} {{ formatValue(selectedPoint.value) }}
      </text>
    </g>

    <!-- tap targets, larger than the dots -->
    <rect
      v-for="p in placed"
      :key="`hit-${p.key}`"
      class="hit"
      :x="p.hitX"
      :y="0"
      :width="p.hitW"
      :height="H"
      @click="selectedKey = p.key"
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
