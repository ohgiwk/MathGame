import { describe, it, expect } from 'vitest'
import type { Course } from '../types/game'
import {
  EMPTY_PROGRESS,
  parseDailyCourses,
  parseProgress,
  clearedIdsOn,
  allCleared,
  markCourseCleared,
  nextCourse,
  longestStreak,
  courseLabel,
  courseMeta,
} from './dailyCourses'

function course(id: string, overrides: Partial<Course> = {}): Course {
  return { id, difficulty: 'normal', operation: 'addition', questionCount: 10, ...overrides }
}

const a = course('a')
const b = course('b')

describe('parseDailyCourses', () => {
  const day = '2026-10-17'

  it('keeps the usable courses of a saved day and drops the rest', () => {
    const mix = course('m', { operation: 'mixed', mixedOperations: ['addition', 'division'] })
    expect(
      parseDailyCourses({
        day,
        level: 12,
        courses: [
          a,
          mix,
          { ...a, questionCount: 'endless' },
          { ...a, difficulty: 'extreme' },
          { ...a, mixedOperations: ['addition'] },
          { ...a, id: 1 },
          null,
        ],
      }),
    ).toEqual({ day, level: 12, courses: [a, mix] })
  })

  it('is null for anything that is not a usable day', () => {
    expect(parseDailyCourses(undefined)).toBeNull()
    expect(parseDailyCourses([a])).toBeNull()
    expect(parseDailyCourses({ day: 'today', level: 1, courses: [a] })).toBeNull()
    expect(parseDailyCourses({ day, courses: [a] })).toBeNull()
    expect(parseDailyCourses({ day, level: 1, courses: [{ id: 'x' }] })).toBeNull()
  })
})

describe('parseProgress', () => {
  it('reads saved progress, sorting and deduplicating the completed days', () => {
    expect(
      parseProgress({
        day: '2026-10-17',
        clearedIds: ['a'],
        completedDays: ['2026-10-16', '2026-10-15', '2026-10-16', 'yesterday'],
      }),
    ).toEqual({ day: '2026-10-17', clearedIds: ['a'], completedDays: ['2026-10-15', '2026-10-16'] })
  })

  it('starts empty from nothing or from broken data', () => {
    expect(parseProgress(undefined)).toEqual(EMPTY_PROGRESS)
    expect(parseProgress({ day: 5, clearedIds: ['a'], completedDays: 'x' })).toEqual(EMPTY_PROGRESS)
  })
})

describe('clearedIdsOn', () => {
  it('only counts clears made on the same day', () => {
    const progress = { day: '2026-10-16', clearedIds: ['a'], completedDays: [] }
    expect(clearedIdsOn(progress, '2026-10-16')).toEqual(['a'])
    expect(clearedIdsOn(progress, '2026-10-17')).toEqual([])
  })
})

describe('allCleared', () => {
  it('needs every course cleared, and at least one course', () => {
    expect(allCleared([a, b], ['a'])).toBe(false)
    expect(allCleared([a, b], ['b', 'a'])).toBe(true)
    expect(allCleared([], [])).toBe(false)
  })
})

describe('markCourseCleared', () => {
  const day = '2026-10-17'

  it('adds the course to the day, once', () => {
    let p = markCourseCleared(EMPTY_PROGRESS, [a, b], 'a', day)
    p = markCourseCleared(p, [a, b], 'a', day)
    expect(p).toEqual({ day, clearedIds: ['a'], completedDays: [] })
  })

  it('completes the day when the last course is cleared', () => {
    let p = markCourseCleared(EMPTY_PROGRESS, [a, b], 'a', day)
    p = markCourseCleared(p, [a, b], 'b', day)
    expect(p.completedDays).toEqual([day])
  })

  it('keeps a completed day completed', () => {
    const p = markCourseCleared(EMPTY_PROGRESS, [a], 'a', day)
    expect(markCourseCleared(p, [a, b], 'a', day).completedDays).toEqual([day])
  })

  it('starts the clears over on a new day, keeping the completed days', () => {
    let p = markCourseCleared(EMPTY_PROGRESS, [a], 'a', '2026-10-16')
    p = markCourseCleared(p, [a, b], 'b', day)
    expect(p).toEqual({ day, clearedIds: ['b'], completedDays: ['2026-10-16'] })
  })
})

describe('nextCourse', () => {
  const c = course('c')

  it('takes the first uncleared course below the current one, wrapping to the top', () => {
    expect(nextCourse([a, b, c], [], 'a')).toBe(b)
    expect(nextCourse([a, b, c], ['b'], 'a')).toBe(c)
    expect(nextCourse([a, b, c], ['a'], 'c')).toBe(b)
  })

  it('is null once every other course is cleared', () => {
    expect(nextCourse([a, b], ['b'], 'a')).toBeNull()
    expect(nextCourse([a], [], 'a')).toBeNull()
  })
})

describe('longestStreak', () => {
  it('finds the longest run of consecutive days, across months and years', () => {
    expect(longestStreak([])).toBe(0)
    expect(longestStreak(['2026-10-17'])).toBe(1)
    expect(
      longestStreak(['2026-01-01', '2025-12-31', '2025-12-30', '2026-01-05', '2026-01-06']),
    ).toBe(3)
    expect(longestStreak(['2026-02-28', '2026-03-01', '2026-03-03'])).toBe(2)
  })
})

describe('courseMeta', () => {
  it('names the difficulty and the length', () => {
    expect(courseMeta(course('e', { difficulty: 'easy', questionCount: 50 }))).toBe('易しい · 50問')
  })
})

describe('courseLabel', () => {
  it('names the difficulty, the operation and the length', () => {
    expect(courseLabel(a)).toBe('普通 · 足し算 · 10問')
    expect(
      courseLabel(
        course('m', {
          difficulty: 'hard',
          operation: 'mixed',
          mixedOperations: ['addition', 'subtraction'],
          questionCount: 30,
        }),
      ),
    ).toBe('難しい · ミックス（+−） · 30問')
  })
})
