import { ref, computed, type Ref } from 'vue'
import { type DayKey, parseDayKey } from '../logic/dailyStats'

function monthIndex(year: number, month: number) {
  return year * 12 + month
}

/**
 * The month a calendar shows, starting at this month. It can go forward up to this month and
 * back as far as the month of `firstDay`; with no first day it cannot go back at all.
 * `viewMonth` is 0-based, as in Date.
 */
export function useMonthNav(firstDay: Ref<DayKey | undefined>) {
  const now = new Date()
  const viewYear = ref(now.getFullYear())
  const viewMonth = ref(now.getMonth())

  const viewIndex = computed(() => monthIndex(viewYear.value, viewMonth.value))
  const canGoNext = computed(() => viewIndex.value < monthIndex(now.getFullYear(), now.getMonth()))
  const canGoPrev = computed(() => {
    if (!firstDay.value) return false
    const { year, month } = parseDayKey(firstDay.value)
    return viewIndex.value > monthIndex(year, month)
  })

  function shiftMonth(delta: number) {
    const i = viewIndex.value + delta
    viewYear.value = Math.floor(i / 12)
    viewMonth.value = i % 12
  }

  return { viewYear, viewMonth, canGoNext, canGoPrev, shiftMonth }
}
