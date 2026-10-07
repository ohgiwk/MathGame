import { describe, it, expect } from 'vitest'
import type { GameRecord } from '../types/game'
import { summarize, summarizeByOperation, formatTotalTime } from './statsCalculator'

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

describe('formatTotalTime', () => {
  it('uses the largest two units that apply', () => {
    expect(formatTotalTime(45)).toBe('45秒')
    expect(formatTotalTime(125)).toBe('2分5秒')
    expect(formatTotalTime(3725)).toBe('1時間2分')
  })
})
