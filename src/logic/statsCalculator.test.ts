import { describe, it, expect } from 'vitest'
import type { GameRecord } from '../types/game'
import { summarize, summarizeByOperation, recordsLike } from './statsCalculator'

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

describe('summarizeByOperation', () => {
  it('returns one row per operation, counting only the given difficulty', () => {
    const rows = summarizeByOperation(
      [
        record(),
        record({ operation: 'division', score: 300 }),
        record({ difficulty: 'hard', score: 5000 }),
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
    expect(rows.map((r) => r.summary.playCount)).toEqual([1, 0, 0, 1, 0])
    expect(rows[0].summary.bestScore).toBe(900)
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
