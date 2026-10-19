import { describe, it, expect } from 'vitest'
import {
  COURSE_TIERS,
  MAX_DAILY_COURSES,
  MIN_DAILY_COURSES,
  generateDailyCourses,
  tierFor,
} from './courseGenerator'
import { ACTUAL_OPERATIONS, DIFFICULTIES, MIN_MIXED_OPERATIONS, OPERATIONS } from './labels'
import { dayKey, type DayKey } from './dailyStats'

/** `count` days in a row from 2026-10-01 */
function days(count: number): DayKey[] {
  return Array.from({ length: count }, (_, i) => dayKey(new Date(2026, 9, 1 + i).getTime()))
}

const LEVELS = [1, 9, 10, 19, 20, 34, 35, 49, 50, 74, 75, 200, 999]

describe('tierFor', () => {
  it('takes the highest tier the level has reached', () => {
    expect(tierFor(1)).toBe(COURSE_TIERS[0])
    expect(tierFor(9)).toBe(COURSE_TIERS[0])
    expect(tierFor(10)).toBe(COURSE_TIERS[1])
    expect(tierFor(999)).toBe(COURSE_TIERS[COURSE_TIERS.length - 1])
  })

  it('goes up in difficulty and never down', () => {
    const hardest = COURSE_TIERS.map((t) =>
      Math.max(...t.difficulties.map((d) => DIFFICULTIES.indexOf(d))),
    )
    expect(hardest).toEqual([...hardest].sort())
  })
})

describe('generateDailyCourses', () => {
  it('sets the same courses for the same day and level', () => {
    for (const day of days(30)) {
      for (const level of LEVELS) {
        expect(generateDailyCourses(level, day)).toEqual(generateDailyCourses(level, day))
      }
    }
  })

  it('does not depend on the time of day', () => {
    const morning = dayKey(new Date(2026, 9, 19, 0, 5).getTime())
    const night = dayKey(new Date(2026, 9, 19, 23, 55).getTime())
    expect(generateDailyCourses(40, morning)).toEqual(generateDailyCourses(40, night))
  })

  it('sets new courses as the days go by', () => {
    // compared without the ids, which name the day
    const sets = days(60).map((day) =>
      JSON.stringify(
        generateDailyCourses(40, day).map((c) => [
          c.difficulty,
          c.operation,
          c.mixedOperations,
          c.questionCount,
        ]),
      ),
    )
    // rarely the same as the day before, and many different sets over two months
    const repeats = sets.filter((s, i) => i > 0 && s === sets[i - 1]).length
    expect(repeats).toBeLessThan(5)
    expect(new Set(sets).size).toBeGreaterThan(40)
  })

  it('sets two to four courses, and every count turns up', () => {
    const counts = days(100).map((day) => generateDailyCourses(20, day).length)
    expect(new Set(counts)).toEqual(new Set([2, 3, 4]))
    expect(Math.min(...counts)).toBe(MIN_DAILY_COURSES)
    expect(Math.max(...counts)).toBe(MAX_DAILY_COURSES)
  })

  it("draws every course from the level's tier, playable and each one different", () => {
    for (const level of LEVELS) {
      const tier = tierFor(level)
      for (const day of days(60)) {
        const courses = generateDailyCourses(level, day)
        expect(courses.map((c) => c.id)).toEqual(courses.map((_, i) => `${day}-${i + 1}`))
        const pairs = courses.map((c) => `${c.difficulty}:${c.operation}`)
        expect(new Set(pairs).size).toBe(courses.length)
        for (const c of courses) {
          expect(tier.difficulties).toContain(c.difficulty)
          expect(tier.operations).toContain(c.operation)
          expect(tier.questionCounts).toContain(c.questionCount)
          if (c.operation === 'mixed') {
            const mix = c.mixedOperations!
            expect(mix.length).toBeGreaterThanOrEqual(MIN_MIXED_OPERATIONS)
            expect(mix).toEqual(ACTUAL_OPERATIONS.filter((op) => mix.includes(op)))
          } else {
            expect(c).not.toHaveProperty('mixedOperations')
          }
        }
      }
    }
  })

  it('lists the courses from the easiest, in the order of the operations', () => {
    for (const day of days(30)) {
      const order = generateDailyCourses(60, day).map(
        (c) => DIFFICULTIES.indexOf(c.difficulty) * 10 + OPERATIONS.indexOf(c.operation),
      )
      expect(order).toEqual([...order].sort((x, y) => x - y))
    }
  })

  it('sets harder courses for a higher level', () => {
    const difficultiesAt = (level: number) =>
      new Set(days(30).flatMap((day) => generateDailyCourses(level, day).map((c) => c.difficulty)))
    expect(difficultiesAt(1)).toEqual(new Set(['easy']))
    expect(difficultiesAt(40)).toEqual(new Set(['normal']))
    expect(difficultiesAt(100)).toEqual(new Set(['hard']))
  })
})
