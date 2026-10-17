import { describe, it, expect } from 'vitest'
import type { GameRecord } from '../types/game'
import { summarize, bestByOperation, recordsLike, accuracyPercent } from './statsCalculator'

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

describe('accuracyPercent', () => {
  it('rounds to a whole percent', () => {
    expect(accuracyPercent(2, 3)).toBe(67)
  })
  it('is null when nothing was answered', () => {
    expect(accuracyPercent(0, 0)).toBeNull()
  })
})

describe('summarize', () => {
  it('returns nulls for the values that need at least one record', () => {
    expect(summarize([])).toEqual({
      playCount: 0,
      clearCount: 0,
      totalAnswered: 0,
      correctCount: 0,
      accuracy: null,
      elapsedSeconds: 0,
      secondsPerQuestion: null,
      totalScore: 0,
      bestScore: null,
    })
  })

  it('totals the records', () => {
    const s = summarize([
      record(),
      record({
        endReason: 'gameover',
        correctCount: 1,
        totalAnswered: 4,
        elapsedSeconds: 16,
        score: 80,
      }),
    ])
    expect(s).toEqual({
      playCount: 2,
      clearCount: 1,
      totalAnswered: 9,
      correctCount: 6,
      accuracy: 67,
      elapsedSeconds: 36,
      secondsPerQuestion: 4,
      totalScore: 980,
      bestScore: 900,
    })
  })
})

describe('bestByOperation', () => {
  it('returns one row per operation with its best game at the given difficulty', () => {
    const rows = bestByOperation(
      [
        record({ id: 'a', score: 700 }),
        record({ id: 'b', score: 900 }),
        record({ id: 'c', operation: 'division', score: 300 }),
        record({ id: 'd', difficulty: 'hard', score: 5000 }),
      ],
      'easy',
    )
    expect(rows.map((r) => r.operation)).toEqual([
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'mixed',
    ])
    expect(rows.map((r) => r.best?.id ?? null)).toEqual(['b', null, null, 'c', null])
  })

  it('keeps the newer of two games tied for best, since records come newest first', () => {
    const rows = bestByOperation([record({ id: 'new' }), record({ id: 'old' })], 'easy')
    expect(rows[0].best?.id).toBe('new')
  })
})

describe('recordsLike', () => {
  it('keeps only records with the same difficulty, operation and question count, in order', () => {
    const records = [
      record({ id: 'a' }),
      record({ id: 'b', difficulty: 'normal' }),
      record({ id: 'c', operation: 'subtraction' }),
      record({ id: 'd', questionCount: 10 }),
      record({ id: 'e' }),
    ]
    expect(recordsLike(records, record()).map((r) => r.id)).toEqual(['a', 'e'])
  })

  it('tells mixes apart by their operations, treating a missing list as all four', () => {
    const mixed = (id: string, mixedOperations?: GameRecord['mixedOperations']) =>
      record({ id, operation: 'mixed', mixedOperations })
    const records = [
      mixed('all'),
      mixed('all4', ['addition', 'subtraction', 'multiplication', 'division']),
      mixed('pm', ['addition', 'subtraction']),
    ]
    expect(recordsLike(records, mixed('x')).map((r) => r.id)).toEqual(['all', 'all4'])
    expect(recordsLike(records, mixed('y', ['addition', 'subtraction'])).map((r) => r.id)).toEqual([
      'pm',
    ])
  })
})
