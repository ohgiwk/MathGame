<script setup lang="ts">
import { computed } from 'vue'
import { type DayKey, dayKey, toDayKey, parseDayKey, monthGrid } from '../logic/dailyStats'
import { WEEKDAY_LABELS } from '../logic/labels'
import { useMonthNav } from '../composables/useMonthNav'

/** A month at a time, with the days on which every daily course was cleared checked */
const props = defineProps<{ completedDays: DayKey[] }>()

const completed = computed(() => new Set(props.completedDays))
const todayKey = dayKey(Date.now())

// back as far as the month of the first completed day
const { viewYear, viewMonth, canGoNext, canGoPrev, shiftMonth } = useMonthNav(
  computed(() => props.completedDays[0]),
)

const monthCount = computed(
  () =>
    props.completedDays.filter((d) => {
      const { year, month } = parseDayKey(d)
      return year === viewYear.value && month === viewMonth.value
    }).length,
)

const weeks = computed(() =>
  monthGrid(viewYear.value, viewMonth.value).map((week) =>
    week.map((date) => {
      if (date === null) return null
      const key = toDayKey(viewYear.value, viewMonth.value, date)
      return { key, date, done: completed.value.has(key) }
    }),
  ),
)
</script>

<template>
  <div class="course-calendar">
    <div class="month-nav">
      <button class="month-btn" aria-label="前の月" :disabled="!canGoPrev" @click="shiftMonth(-1)">
        ‹
      </button>
      <div class="month-title">
        {{ viewYear }}年{{ viewMonth + 1 }}月
        <span class="month-count">{{ monthCount }}日クリア</span>
      </div>
      <button class="month-btn" aria-label="次の月" :disabled="!canGoNext" @click="shiftMonth(1)">
        ›
      </button>
    </div>

    <div class="cal-grid">
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
        <div
          v-else
          class="cal-cell"
          :class="{ done: cell.done, today: cell.key === todayKey, sun: ci === 0, sat: ci === 6 }"
          :aria-label="`${cell.date}日${cell.done ? ' 全クリア' : ''}`"
        >
          <svg v-if="cell.done" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
          <span v-else>{{ cell.date }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.course-calendar {
  flex-shrink: 0;
}
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.month-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-sub);
  font-size: 1.35rem;
  line-height: 1;
  padding-bottom: 3px;
  cursor: pointer;
}
.month-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.month-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}
.month-count {
  margin-left: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--success-text);
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}
.cal-weekday {
  text-align: center;
  font-size: 0.72rem;
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
  width: 38px;
  height: 38px;
  justify-self: center;
  border: 1px solid transparent;
  border-radius: 50%;
  background: rgba(var(--wash-rgb), 0.04);
  color: var(--text-sub);
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-cell.sun {
  color: var(--danger-text);
}
.cal-cell.sat {
  color: var(--text-sat);
}
.cal-cell.empty {
  background: transparent;
}
.cal-cell.done {
  background: var(--success-text);
}
.cal-cell svg {
  width: 18px;
  height: 18px;
  fill: none;
  /* the card color, so the check reads on the green in both themes, as in the course list */
  stroke: var(--bg-card);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.cal-cell.today {
  border-color: var(--gem-teal);
}
.cal-cell.done.today svg {
  animation: check-pop 0.35s ease 0.2s backwards;
}
@keyframes check-pop {
  0% {
    transform: scale(0.4);
  }
  70% {
    transform: scale(1.2);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cal-cell.done.today svg {
    animation: none;
  }
}
</style>
