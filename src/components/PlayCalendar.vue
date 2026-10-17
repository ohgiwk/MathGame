<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GameRecord } from '../types/game'
import {
  type DayKey,
  dayKey,
  toDayKey,
  parseDayKey,
  summarizeByDay,
  monthGrid,
  currentStreak,
} from '../logic/dailyStats'
import { WEEKDAY_LABELS } from '../logic/labels'

const props = defineProps<{ records: GameRecord[] }>()
const emit = defineEmits<{ select: [day: DayKey] }>()

const days = computed(() => summarizeByDay(props.records))
const dayMap = computed(() => new Map(days.value.map((d) => [d.day, d])))
const streak = computed(() => currentStreak(new Set(dayMap.value.keys()), Date.now()))
const todayKey = dayKey(Date.now())

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())

function monthIndex(year: number, month: number) {
  return year * 12 + month
}
const viewIndex = computed(() => monthIndex(viewYear.value, viewMonth.value))
const canGoNext = computed(() => viewIndex.value < monthIndex(now.getFullYear(), now.getMonth()))
const canGoPrev = computed(() => {
  const first = days.value[0]
  if (!first) return false
  const { year, month } = parseDayKey(first.day)
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
        <!-- tapping a played day opens it in the history tab -->
        <button
          v-else
          class="cal-cell"
          :class="[`level-${cell.level}`, { today: cell.key === todayKey }]"
          :disabled="cell.count === 0"
          :aria-label="`${cell.date}日 ${cell.count}回`"
          @click="emit('select', cell.key)"
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
</style>
