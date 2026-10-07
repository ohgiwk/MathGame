import { describe, it, expect } from 'vitest'
import type { GameState } from '../types/game'
import { calculateResult } from './resultCalculator'

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    settings: { questionCount: 5, difficulty: 'easy', operation: 'addition' },
    questions: [],
    currentIndex: 4,
    lives: 3,
    correctCount: 5,
    startedAt: 1_000,
    feedback: null,
    ...overrides,
  }
}

describe('calculateResult', () => {
  it('measures elapsed time from the start of the game to the given end time', () => {
    const r = calculateResult(state(), 'clear', 11_400)
    expect(r.outcome.elapsedSeconds).toBe(10)
  })

  it('reports a perfect clear', () => {
    const r = calculateResult(state(), 'clear', 11_000)
    expect(r.outcome).toEqual({
      questionCount: 5,
      difficulty: 'easy',
      operation: 'addition',
      endReason: 'clear',
      correctCount: 5,
      totalAnswered: 5,
      elapsedSeconds: 10,
    })
    expect(r.accuracy).toBe(100)
    expect(r.score.score).toBe(975)
  })

  it('counts only the questions reached on a game over', () => {
    const r = calculateResult(
      state({ currentIndex: 3, lives: 0, correctCount: 1 }),
      'gameover',
      21_000,
    )
    expect(r.outcome).toMatchObject({ totalAnswered: 4, questionCount: 5 })
    expect(r.accuracy).toBe(25)
  })
})
