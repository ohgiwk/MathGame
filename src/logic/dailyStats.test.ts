import { describe, it, expect } from 'vitest'
import type { GameRecord } from '../types/game'
import {
  dayKey,
  toDayKey,
  summarizeByDay,
  parseDayKey,
  monthGrid,
  currentStreak,
} from './dailyStats'

function record(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    id: 'r',
    playedAt: 0,
    difficulty: 'easy',
    operation: 'addition',
    questionCount: 5,
    endReason: 'clear',
    correctCount: 5,
    totalAnswered: 5,
    elapsedSeconds: 20,
    score: 900,
    ...overrides,
  }
}

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime()

describe('dayKey', () => {
  it('uses the local calendar day, zero-padded', () => {
    expect(dayKey(at(2026, 0, 5, 0))).toBe('2026-01-05')
    expect(dayKey(at(2026, 11, 31, 23))).toBe('2026-12-31')
    expect(toDayKey(2026, 9, 16)).toBe('2026-10-16')
  })
})

describe('summarizeByDay', () => {
  it('returns nothing for no records', () => {
    expect(summarizeByDay([])).toEqual([])
  })

  it('groups records by day, oldest first, with the average score', () => {
    const days = summarizeByDay([
      record({ playedAt: at(2026, 9, 16, 20), score: 1000 }),
      record({ playedAt: at(2026, 9, 16, 8), score: 501 }),
      record({ playedAt: at(2026, 9, 3), score: 300 }),
    ])
    expect(days.map((d) => d.day)).toEqual(['2026-10-03', '2026-10-16'])
    expect(days[1]).toMatchObject({ playCount: 2, averageScore: 751, bestScore: 1000 })
    expect(days[0]).toMatchObject({ playCount: 1, averageScore: 300 })
  })
})

describe('parseDayKey', () => {
  it('reverses toDayKey, with a 0-based month', () => {
    expect(parseDayKey(toDayKey(2026, 0, 9))).toEqual({ year: 2026, month: 0, date: 9 })
  })
})

describe('monthGrid', () => {
  it('starts weeks on Sunday and pads both ends', () => {
    // October 2026 starts on a Thursday and has 31 days
    const weeks = monthGrid(2026, 9)
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual([null, null, null, null, 1, 2, 3])
    expect(weeks[4]).toEqual([25, 26, 27, 28, 29, 30, 31])
  })

  it('fills the last week with nulls', () => {
    // February 2026 starts on a Sunday and has 28 days
    expect(monthGrid(2026, 1)).toHaveLength(4)
    expect(monthGrid(2026, 3).at(-1)).toEqual([26, 27, 28, 29, 30, null, null])
  })
})

describe('currentStreak', () => {
  const days = (...keys: string[]) => new Set(keys)
  const now = at(2026, 9, 16)

  it('counts back from today', () => {
    expect(currentStreak(days('2026-10-14', '2026-10-15', '2026-10-16'), now)).toBe(3)
  })

  it('still counts a streak that ended yesterday', () => {
    expect(currentStreak(days('2026-10-14', '2026-10-15'), now)).toBe(2)
  })

  it('is broken by a missed day', () => {
    expect(currentStreak(days('2026-10-13', '2026-10-14'), now)).toBe(0)
    expect(currentStreak(days(), now)).toBe(0)
  })

  it('crosses month boundaries', () => {
    expect(currentStreak(days('2026-09-30', '2026-10-01'), at(2026, 9, 1))).toBe(2)
  })
})
