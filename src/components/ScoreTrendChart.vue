<script setup lang="ts">
import { computed } from 'vue'
import type { GameRecord } from '../types/game'
import { summarizeByDay } from '../logic/dailyStats'
import { formatScore, formatShortDay } from '../logic/format'
import TrendChart from './TrendChart.vue'

/** The games to chart, already narrowed to one kind; each day plots its best score */
const props = defineProps<{ records: GameRecord[] }>()

/** How many play days the chart shows, newest last */
const CHART_DAYS = 14

// every summarized day has at least one game, so its best score is set
const points = computed(() =>
  summarizeByDay(props.records)
    .slice(-CHART_DAYS)
    .map((d) => ({ key: d.day, value: d.bestScore ?? 0, label: formatShortDay(d.day) })),
)

function formatAxis(value: number) {
  return value >= 10000 ? `${value / 1000}k` : formatScore(value)
}
</script>

<template>
  <TrendChart
    :points="points"
    :format-value="formatScore"
    :format-axis="formatAxis"
    label="日ごとの最高スコアの推移"
  />
</template>
