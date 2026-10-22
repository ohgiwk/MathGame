import { describe, it, expect } from 'vitest'
import type { HundredRecord } from '../types/game'
import {
  parseHundredRecords,
  bestRecordsOf,
  beatsBest,
  bestRecordIds,
  summarizeHundred,
  expForHundred,
  totalHundredExp,
  hundredLevel,
} from './hundredRecords'

const record = (id: string, over: Partial<HundredRecord> = {}): HundredRecord => ({
  id,
  playedAt: 1000,
  operation: 'addition',
  elapsedMs: 90_000,
  correctCount: 100,
  ...over,
})

describe('parseHundredRecords', () => {
  it('keeps usable records and drops the rest', () => {
    const good = record('a')
    expect(
      parseHundredRecords([
        good,
        { ...good, operation: 'division' },
        { ...good, correctCount: 101 },
        null,
      ]),
    ).toEqual([good])
    expect(parseHundredRecords(undefined)).toEqual([])
  })
})

describe('best times', () => {
  it('takes over only when faster with no more misses, and with at least 90 cells right', () => {
    const best = record('best', { elapsedMs: 80_000, correctCount: 95 })
    expect(beatsBest(record('x', { elapsedMs: 70_000, correctCount: 95 }), best)).toBe(true)
    expect(beatsBest(record('x', { elapsedMs: 70_000, correctCount: 100 }), best)).toBe(true)
    // faster, but more misses
    expect(beatsBest(record('x', { elapsedMs: 70_000, correctCount: 94 }), best)).toBe(false)
    // fewer misses, but slower
    expect(beatsBest(record('x', { elapsedMs: 90_000, correctCount: 100 }), best)).toBe(false)
    expect(beatsBest(record('x', { correctCount: 90 }), undefined)).toBe(true)
    expect(beatsBest(record('x', { correctCount: 89 }), undefined)).toBe(false)
  })

  // newest first
  const records = [
    record('new', { elapsedMs: 70_000 }),
    record('fast-more-misses', { elapsedMs: 50_000, correctCount: 92 }),
    record('too-many-misses', { elapsedMs: 30_000, correctCount: 89 }),
    record('old', { elapsedMs: 80_000, correctCount: 95 }),
    record('slow', { elapsedMs: 120_000, correctCount: 90 }),
    record('sub', { operation: 'subtraction', elapsedMs: 100_000 }),
  ]

  it('follows the grids in the order they were played', () => {
    expect(bestRecordsOf(records)).toEqual({ addition: records[0], subtraction: records[5] })
    // without the newest, the faster grid with more misses never took over from 'old'
    expect(bestRecordsOf(records.slice(1)).addition?.id).toBe('old')
  })

  it('marks the best record of each operation', () => {
    expect(bestRecordIds(records)).toEqual(new Set(['new', 'sub']))
  })
})

describe('summarizeHundred', () => {
  it('counts plays, perfect grids and the share of cells right', () => {
    expect(
      summarizeHundred([record('a'), record('b', { correctCount: 90, elapsedMs: 10_000 })]),
    ).toEqual({ playCount: 2, perfectCount: 1, accuracy: 95, totalMs: 100_000 })
    expect(summarizeHundred([]).accuracy).toBeNull()
  })
})

describe('EXP', () => {
  it('gives a point per cell right, a bonus for no miss and one for each second under 5 minutes', () => {
    expect(expForHundred({ correctCount: 100, elapsedMs: 120_000 })).toBe(100 + 50 + 180)
    // the speed bonus shrinks with the misses
    expect(expForHundred({ correctCount: 50, elapsedMs: 120_000 })).toBe(50 + 90)
    expect(expForHundred({ correctCount: 0, elapsedMs: 10_000 })).toBe(0)
    expect(expForHundred({ correctCount: 100, elapsedMs: 400_000 })).toBe(150)
  })

  it('adds up every grid into the level', () => {
    const records = [record('a'), record('b', { correctCount: 90, elapsedMs: 300_000 })]
    expect(totalHundredExp(records)).toBe(100 + 50 + 210 + 90)
    expect(hundredLevel(records).level).toBe(3)
    expect(hundredLevel([]).level).toBe(1)
  })
})
