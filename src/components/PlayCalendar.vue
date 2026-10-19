<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GameRecord } from '../types/game'
import {
  type DayKey,
  dayKey,
  toDayKey,
  summarizeByDay,
  monthGrid,
  currentStreak,
} from '../logic/dailyStats'
import { WEEKDAY_LABELS } from '../logic/labels'
import { formatDayHeading } from '../logic/format'
import { useMonthNav } from '../composables/useMonthNav'
import HistoryRow from './HistoryRow.vue'

const props = defineProps<{
  /** Newest first */
  records: GameRecord[]
}>()
/** asks for the day to be opened in the history tab */
const emit = defineEmits<{ select: [day: DayKey] }>()

/** How many of the chosen day's games show under the calendar */
const DAY_PREVIEW = 3

const days = computed(() => summarizeByDay(props.records))
const dayMap = computed(() => new Map(days.value.map((d) => [d.day, d])))
const streak = computed(() => currentStreak(new Set(dayMap.value.keys()), Date.now()))
const todayKey = dayKey(Date.now())

const { viewYear, viewMonth, canGoNext, canGoPrev, shiftMonth } = useMonthNav(
  computed(() => days.value[0]?.day),
)

// the day whose games show under the calendar; the latest played day unless one is tapped
const selectedDay = ref<DayKey | null>(null)
watch(
  days,
  (list) => {
    if (!list.some((d) => d.day === selectedDay.value)) selectedDay.value = list.at(-1)?.day ?? null
  },
  { immediate: true },
)
const selectedSummary = computed(() =>
  selectedDay.value ? (dayMap.value.get(selectedDay.value) ?? null) : null,
)
const selectedRecords = computed(() =>
  props.records.filter((r) => dayKey(r.playedAt) === selectedDay.value).slice(0, DAY_PREVIEW),
)

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
</script>

<template>
  <div class="rpg-card stats-section">
    <h2 class="section-label">
      <span class="section-gem">◆</span> カレンダー
      <span class="section-note">
        <template v-if="streak > 0">連続 {{ streak }}日 · </template>合計 {{ days.length }}日
      </span>
    </h2>

    <div class="month-nav">
      <button class="month-btn" aria-label="前の月" :disabled="!canGoPrev" @click="shiftMonth(-1)">
        ‹
      </button>
      <div class="month-title">{{ viewYear }}年{{ viewMonth + 1 }}月</div>
      <button class="month-btn" aria-label="次の月" :disabled="!canGoNext" @click="shiftMonth(1)">
        ›
      </button>
    </div>

    <div class="cal-grid cal-head">
      <div
        v-for="(w, i) in WEEKDAY_LABELS"
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
        <!-- tapping a played day shows its games under the calendar -->
        <button
          v-else
          class="cal-cell"
          :class="[
            `level-${cell.level}`,
            { today: cell.key === todayKey, selected: cell.key === selectedDay },
          ]"
          :disabled="cell.count === 0"
          :aria-label="`${cell.date}日 ${cell.count}回`"
          :aria-pressed="cell.key === selectedDay"
          @click="selectedDay = cell.key"
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

    <!-- the chosen day: how often it was played and its newest games -->
    <div v-if="selectedSummary" class="day-detail">
      <div class="day-head">
        <span class="day-title">{{ formatDayHeading(selectedSummary.day) }}</span>
        <span class="day-count">
          <span class="day-count-value">{{ selectedSummary.playCount }}</span
          >回プレイ
        </span>
      </div>
      <ul class="day-list">
        <HistoryRow v-for="r in selectedRecords" :key="r.id" :record="r" compact />
      </ul>
      <button class="more-btn" @click="emit('select', selectedSummary.day)">
        もっと見る <span aria-hidden="true">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
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
  box-shadow:
    0 0 0 2px var(--gold-light),
    0 0 8px rgba(var(--gold-rgb), 0.45);
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

/* the chosen day */
.day-detail {
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border);
}
.day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.day-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-main);
}
.day-count {
  font-size: 0.7rem;
  color: var(--text-sub);
}
.day-count-value {
  margin-right: 1px;
  font-size: 1rem;
  font-weight: 900;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
}
.day-list {
  list-style: none;
}
</style>
