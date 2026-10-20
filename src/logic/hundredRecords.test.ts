import { describe, it, expect } from 'vitest'
import type { HundredRecord } from '../types/game'
import { parseHundredRecords, bestTimesOf, bestRecordIds, summarizeHundred } from './hundredRecords'

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
  // newest first
  const records = [
    record('new', { elapsedMs: 80_000 }),
    record('fast-miss', { elapsedMs: 50_000, correctCount: 99 }),
    record('old', { elapsedMs: 80_000 }),
    record('slow', { elapsedMs: 120_000 }),
    record('sub', { operation: 'subtraction', elapsedMs: 100_000 }),
  ]

  it('takes the fastest perfect grid of each operation', () => {
    expect(bestTimesOf(records)).toEqual({ addition: 80_000, subtraction: 100_000 })
  })

  it('marks one record per operation, the newest with the best time', () => {
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
