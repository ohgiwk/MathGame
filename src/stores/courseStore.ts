import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Course } from '../types/game'
import {
  parseDailyCourses,
  parseProgress,
  clearedIdsOn,
  allCleared,
  markCourseCleared,
  nextCourse as nextCourseIn,
  longestStreak,
  type CourseProgress,
  type DailyCourses,
} from '../logic/dailyCourses'
import { generateDailyCourses } from '../logic/courseGenerator'
import { currentStreak, dayKey, parseDayKey } from '../logic/dailyStats'
import { levelFromExp, totalExp } from '../logic/level'
import { readJson, writeJson } from '../logic/storage'
import { useStatsStore } from './statsStore'

const DAILY_KEY = 'math-kingdom:daily-courses'
const PROGRESS_KEY = 'math-kingdom:course-progress'

/**
 * Today's daily courses, set automatically for the player's level, which of them are cleared, and
 * the days all of them were
 */
export const useCourseStore = defineStore('courses', () => {
  const statsStore = useStatsStore()
  const daily = ref<DailyCourses | null>(parseDailyCourses(readJson(DAILY_KEY)))
  const progress = ref<CourseProgress>(parseProgress(readJson(PROGRESS_KEY)))
  /** today's key; refreshed whenever it matters, so the courses change once the date does */
  const today = ref(dayKey(Date.now()))

  /**
   * Sets the day's courses for the level the player is at, the first time they are needed that
   * day; they are kept so a level up during the day does not change them
   */
  function refreshDay() {
    today.value = dayKey(Date.now())
    if (daily.value?.day === today.value) return
    const level = levelFromExp(totalExp(statsStore.records)).level
    daily.value = { day: today.value, level, courses: generateDailyCourses(level, today.value) }
    writeJson(DAILY_KEY, daily.value)
  }
  refreshDay()

  const courses = computed<Course[]>(() => daily.value?.courses ?? [])
  /** the level today's courses were set for */
  const level = computed(() => daily.value?.level ?? 1)

  const clearedIds = computed(() => clearedIdsOn(progress.value, today.value))
  const clearedCount = computed(
    () => courses.value.filter((c) => clearedIds.value.includes(c.id)).length,
  )
  const allClearedToday = computed(() => allCleared(courses.value, clearedIds.value))
  /** Days in a row with every course cleared, up to today (or yesterday while today is open) */
  const streak = computed(() => {
    const { year, month, date } = parseDayKey(today.value)
    return currentStreak(
      new Set(progress.value.completedDays),
      new Date(year, month, date).getTime(),
    )
  })
  const bestStreak = computed(() => longestStreak(progress.value.completedDays))
  /** days on which every course was cleared, oldest first */
  const completedDays = computed(() => progress.value.completedDays)

  function isCleared(id: string): boolean {
    return clearedIds.value.includes(id)
  }

  /** The uncleared course to play after `id`, in list order */
  function nextCourse(id: string): Course | null {
    return nextCourseIn(courses.value, clearedIds.value, id)
  }

  /** Checks a course off; one from an earlier day no longer counts */
  function markCleared(id: string) {
    refreshDay()
    if (!courses.value.some((c) => c.id === id)) return
    progress.value = markCourseCleared(progress.value, courses.value, id, today.value)
    writeJson(PROGRESS_KEY, progress.value)
  }

  return {
    courses,
    level,
    clearedCount,
    allClearedToday,
    streak,
    bestStreak,
    completedDays,
    refreshDay,
    isCleared,
    nextCourse,
    markCleared,
  }
})
