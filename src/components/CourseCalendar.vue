<script setup lang="ts">
import { computed } from 'vue'
import { type DayKey, dayKey, toDayKey, parseDayKey, monthGrid } from '../logic/dailyStats'
import { WEEKDAY_LABELS } from '../logic/labels'
import { useMonthNav } from '../composables/useMonthNav'

/**
 * A month at a time, with the days on which every daily course was cleared checked. With
 * `celebrate`, today's check goes on with a burst, for when its last course was just cleared.
 */
const props = defineProps<{ completedDays: DayKey[]; celebrate?: boolean }>()

/** the number of sparks thrown out around today's check when it is celebrated */
const SPARK_COUNT = 12

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
        <span class="month-count" :class="{ celebrate }">{{ monthCount }}日クリア</span>
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
          :class="{
            done: cell.done,
            today: cell.key === todayKey,
            celebrate: celebrate && cell.done && cell.key === todayKey,
            sun: ci === 0,
            sat: ci === 6,
          }"
          :aria-label="`${cell.date}日${cell.done ? ' 全クリア' : ''}`"
        >
          <template v-if="celebrate && cell.done && cell.key === todayKey">
            <!-- the date gives way to a disk that bursts in, its check drawn on, a ring and sparks -->
            <span class="old-date" aria-hidden="true">{{ cell.date }}</span>
            <span class="burst-ring" aria-hidden="true" />
            <span class="burst-ring second" aria-hidden="true" />
            <span
              v-for="n in SPARK_COUNT"
              :key="n"
              class="spark"
              :class="{ alt: n % 2 === 0 }"
              :style="{ '--angle': `${(360 / SPARK_COUNT) * n}deg` }"
              aria-hidden="true"
            />
          </template>
          <svg v-if="cell.done" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" pathLength="1" />
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

/* Celebrated: once the dialog is up, the date shrinks away, a green disk bursts in past its size
   and settles, the check is drawn on, and a ring and sparks fly out while the cell glows */
.cal-cell.celebrate {
  position: relative;
  z-index: 1;
  background: transparent;
  animation: celebrate-glow 1.2s ease-out 0.75s backwards;
}
.cal-cell.celebrate::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  background: var(--success-text);
  animation: disk-burst 0.55s cubic-bezier(0.34, 1.8, 0.64, 1) 0.45s backwards;
}
.cal-cell.done.today.celebrate svg {
  position: relative;
  stroke-dasharray: 1;
  animation: check-draw 0.35s ease-out 0.75s backwards;
}
.old-date {
  position: absolute;
  animation: date-out 0.3s ease-in 0.3s forwards;
}
.burst-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 4px solid var(--gold-spark);
  box-shadow:
    0 0 14px rgba(var(--gold-spark-rgb), 0.9),
    inset 0 0 8px rgba(var(--gold-spark-rgb), 0.7);
  opacity: 0;
  animation: ring-out 0.75s ease-out 0.8s;
}
.burst-ring.second {
  border-width: 2px;
  box-shadow: 0 0 10px rgba(var(--gold-spark-rgb), 0.8);
  animation-delay: 0.95s;
}
.spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 9px;
  margin: -4.5px;
  border-radius: 50%;
  background: var(--gold-spark);
  box-shadow: 0 0 10px 3px rgba(var(--gold-spark-rgb), 0.85);
  opacity: 0;
  animation: spark-fly 0.9s cubic-bezier(0.2, 0.8, 0.4, 1) 0.8s;
}
.spark.alt {
  width: 7px;
  height: 7px;
  margin: -3.5px;
  box-shadow: 0 0 8px 2px rgba(var(--gold-spark-rgb), 0.7);
  animation-duration: 0.75s;
  --distance: 44px;
}
.month-count.celebrate {
  display: inline-block;
  animation: count-bump 0.45s ease 0.85s;
}
@keyframes date-out {
  to {
    opacity: 0;
    transform: scale(0.3);
  }
}
@keyframes disk-burst {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  40% {
    opacity: 1;
  }
}
@keyframes check-draw {
  from {
    stroke-dashoffset: 1;
  }
}
@keyframes ring-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(3);
  }
}
@keyframes spark-fly {
  0% {
    opacity: 1;
    transform: rotate(var(--angle)) translateY(0) scale(1.3);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(calc(-1 * var(--distance, 64px))) scale(0.4);
  }
}
@keyframes celebrate-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--gold-spark-rgb), 0.9);
  }
  30% {
    box-shadow: 0 0 28px 12px rgba(var(--gold-spark-rgb), 0.6);
  }
  100% {
    box-shadow: 0 0 28px 16px rgba(var(--gold-spark-rgb), 0);
  }
}
@keyframes count-bump {
  50% {
    transform: scale(1.3);
    color: var(--gold-light);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cal-cell.done.today svg,
  .cal-cell.celebrate,
  .cal-cell.celebrate::before,
  .cal-cell.done.today.celebrate svg,
  .month-count.celebrate {
    animation: none;
  }
  .old-date,
  .burst-ring,
  .spark {
    display: none;
  }
}
</style>
