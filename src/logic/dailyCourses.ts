import type { Course, FixedQuestionCount } from '../types/game'
import {
  ACTUAL_OPERATIONS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  MIN_MIXED_OPERATIONS,
  OPERATIONS,
  QUESTION_COUNTS,
} from './labels'
import { isOneOf } from './guards'
import { dayKey, parseDayKey, type DayKey } from './dailyStats'

/** The lengths a course can have: every length but endless, which has no clear */
export const COURSE_QUESTION_COUNTS = QUESTION_COUNTS.filter(
  (c): c is FixedQuestionCount => c !== 'endless',
)

/** The courses set for one day, kept so they stay the same all day even if the level goes up */
export interface DailyCourses {
  day: DayKey
  /** the player's level when the courses were set */
  level: number
  courses: Course[]
}

/** Which courses are cleared today, and the days on which all of them were */
export interface CourseProgress {
  /** the day `clearedIds` were cleared on; on any other day nothing counts as cleared */
  day: DayKey | null
  clearedIds: string[]
  /** days on which every course was cleared, oldest first */
  completedDays: DayKey[]
}

export const EMPTY_PROGRESS: CourseProgress = { day: null, clearedIds: [], completedDays: [] }

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && DAY_KEY_PATTERN.test(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isCourse(value: unknown): value is Course {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  const mix = c.mixedOperations
  return (
    typeof c.id === 'string' &&
    isOneOf(DIFFICULTIES, c.difficulty) &&
    isOneOf(OPERATIONS, c.operation) &&
    (mix === undefined ||
      (Array.isArray(mix) &&
        mix.length >= MIN_MIXED_OPERATIONS &&
        mix.every((op) => isOneOf(ACTUAL_OPERATIONS, op)))) &&
    isOneOf(COURSE_QUESTION_COUNTS, c.questionCount)
  )
}

/** Turns whatever was read from storage into a day's courses; null when it is not usable */
export function parseDailyCourses(stored: unknown): DailyCourses | null {
  if (typeof stored !== 'object' || stored === null) return null
  const d = stored as Record<string, unknown>
  if (!isDayKey(d.day) || typeof d.level !== 'number' || !Array.isArray(d.courses)) return null
  const courses = d.courses.filter(isCourse).map((c) => ({ ...c }))
  if (courses.length === 0) return null
  return { day: d.day, level: d.level, courses }
}

export function parseProgress(stored: unknown): CourseProgress {
  if (typeof stored !== 'object' || stored === null) return { ...EMPTY_PROGRESS }
  const p = stored as Record<string, unknown>
  const completed = isStringArray(p.completedDays) ? p.completedDays.filter(isDayKey) : []
  return {
    day: isDayKey(p.day) ? p.day : null,
    clearedIds: isDayKey(p.day) && isStringArray(p.clearedIds) ? p.clearedIds : [],
    completedDays: [...new Set(completed)].sort(),
  }
}

/** The ids of the courses cleared on `day` */
export function clearedIdsOn(progress: CourseProgress, day: DayKey): string[] {
  return progress.day === day ? progress.clearedIds : []
}

/** Whether there is at least one course and every one of them is in `clearedIds` */
export function allCleared(courses: readonly Course[], clearedIds: readonly string[]): boolean {
  return courses.length > 0 && courses.every((c) => clearedIds.includes(c.id))
}

/**
 * Marks a course as cleared on `day`, and the day as completed when it was the last one left.
 * A day once completed stays completed.
 */
export function markCourseCleared(
  progress: CourseProgress,
  courses: readonly Course[],
  courseId: string,
  day: DayKey,
): CourseProgress {
  const cleared = clearedIdsOn(progress, day)
  const clearedIds = cleared.includes(courseId) ? cleared : [...cleared, courseId]
  const completes = !progress.completedDays.includes(day) && allCleared(courses, clearedIds)
  return {
    ...progress,
    day,
    clearedIds,
    completedDays: completes ? [...progress.completedDays, day].sort() : progress.completedDays,
  }
}

/**
 * The course to play after `currentId`: the first one not yet cleared, looking down the list from
 * just after it and wrapping around to the top. Null once every other course is cleared.
 */
export function nextCourse(
  courses: readonly Course[],
  clearedIds: readonly string[],
  currentId: string,
): Course | null {
  const start = courses.findIndex((c) => c.id === currentId) + 1
  const ordered = [...courses.slice(start), ...courses.slice(0, start)]
  return ordered.find((c) => c.id !== currentId && !clearedIds.includes(c.id)) ?? null
}

function nextDay(key: DayKey): DayKey {
  const { year, month, date } = parseDayKey(key)
  return dayKey(new Date(year, month, date + 1).getTime())
}

/** The longest run of consecutive days among `days`, in any order */
export function longestStreak(days: Iterable<DayKey>): number {
  const sorted = [...new Set(days)].sort()
  let best = 0
  let run = 0
  sorted.forEach((day, i) => {
    run = i > 0 && nextDay(sorted[i - 1]) === day ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

/** The second line under a course's operation, e.g. "普通 · 10問" */
export function courseMeta(course: Course): string {
  return `${DIFFICULTY_LABELS[course.difficulty]} · ${course.questionCount}問`
}
