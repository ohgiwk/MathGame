import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Course } from '../types/game'
import {
  parseCourses,
  parseProgress,
  clearedIdsOn,
  allCleared,
  markCourseCleared,
  syncCompletion,
  nextCourse as nextCourseIn,
  longestStreak,
  type CourseProgress,
} from '../logic/dailyCourses'
import { currentStreak, dayKey, parseDayKey } from '../logic/dailyStats'
import { readJson, writeJson } from '../logic/storage'

const COURSES_KEY = 'math-kingdom:courses'
const PROGRESS_KEY = 'math-kingdom:course-progress'

export type CourseSettings = Omit<Course, 'id'>

/** Only a mix keeps its operations */
function normalize(settings: CourseSettings): CourseSettings {
  const { mixedOperations, ...rest } = settings
  return settings.operation === 'mixed' && mixedOperations
    ? { ...rest, mixedOperations: [...mixedOperations] }
    : rest
}

/** The daily courses, which of them are cleared today, and the days all of them were */
export const useCourseStore = defineStore('courses', () => {
  const courses = ref<Course[]>(parseCourses(readJson(COURSES_KEY)))
  const progress = ref<CourseProgress>(parseProgress(readJson(PROGRESS_KEY)))
  /** today's key; refreshed whenever it matters, so the checks reset once the date changes */
  const today = ref(dayKey(Date.now()))

  function refreshDay() {
    today.value = dayKey(Date.now())
  }

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

  function isCleared(id: string): boolean {
    return clearedIds.value.includes(id)
  }

  /** The uncleared course to play after `id`, in list order */
  function nextCourse(id: string): Course | null {
    return nextCourseIn(courses.value, clearedIds.value, id)
  }

  function saveCourses() {
    // a change of courses can complete the day, e.g. by deleting the last uncleared one
    progress.value = syncCompletion(progress.value, courses.value, today.value)
    writeJson(COURSES_KEY, courses.value)
    writeJson(PROGRESS_KEY, progress.value)
  }

  function addCourse(settings: CourseSettings) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    courses.value.push({ id, ...normalize(settings) })
    saveCourses()
  }

  function updateCourse(id: string, settings: CourseSettings) {
    const i = courses.value.findIndex((c) => c.id === id)
    if (i < 0) return
    courses.value[i] = { id, ...normalize(settings) }
    saveCourses()
  }

  function removeCourse(id: string) {
    refreshDay()
    courses.value = courses.value.filter((c) => c.id !== id)
    saveCourses()
  }

  /** Moves a course up (-1) or down (+1) the list */
  function moveCourse(id: string, delta: -1 | 1) {
    const i = courses.value.findIndex((c) => c.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= courses.value.length) return
    const list = [...courses.value]
    ;[list[i], list[j]] = [list[j], list[i]]
    courses.value = list
    writeJson(COURSES_KEY, courses.value)
  }

  function markCleared(id: string) {
    refreshDay()
    if (!courses.value.some((c) => c.id === id)) return
    progress.value = markCourseCleared(progress.value, courses.value, id, today.value)
    writeJson(PROGRESS_KEY, progress.value)
  }

  return {
    courses,
    clearedCount,
    allClearedToday,
    streak,
    bestStreak,
    refreshDay,
    isCleared,
    nextCourse,
    addCourse,
    updateCourse,
    removeCourse,
    moveCourse,
    markCleared,
  }
})
