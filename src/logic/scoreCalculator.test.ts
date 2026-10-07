import { describe, it, expect } from 'vitest'
import type { GameOutcome } from '../types/game'
import { calculateScore, calculateRating } from './scoreCalculator'

const base: GameOutcome = {
  difficulty: 'easy',
  operation: 'addition',
  questionCount: 5,
  endReason: 'clear',
  correctCount: 5,
  totalAnswered: 5,
  elapsedSeconds: 10,
}

describe('calculateScore', () => {
  it('gives a fast perfect clear the full speed, clear and perfect bonuses', () => {
    const s = calculateScore(base)
    expect(s.base).toBe(500)
    expect(s.speedMultiplier).toBeCloseTo(1.5)
    expect(s.mistakeMultiplier).toBe(1)
    expect(s.clearMultiplier).toBeCloseTo(1.3)
    expect(s.score).toBe(975)
  })

  it('drops the speed bonus once thinking time reaches three times par', () => {
    const s = calculateScore({ ...base, elapsedSeconds: 50 })
    expect(s.speedMultiplier).toBe(1)
    expect(s.score).toBe(650)
  })

  it('scales the speed bonus linearly between par and the slow limit', () => {
    // 6s of thinking per question plus 0.9s of feedback: halfway between par (3s) and slow (9s)
    const s = calculateScore({ ...base, elapsedSeconds: 34.5 })
    expect(s.speedMultiplier).toBeCloseTo(1.25)
  })

  it('applies the mistake penalty and no perfect bonus on a clear with mistakes', () => {
    const s = calculateScore({
      ...base,
      difficulty: 'normal',
      operation: 'multiplication',
      questionCount: 10,
      correctCount: 8,
      totalAnswered: 10,
      elapsedSeconds: 500,
    })
    expect(s.base).toBe(1560)
    expect(s.mistakeMultiplier).toBeCloseTo(0.8)
    expect(s.clearMultiplier).toBeCloseTo(1.2)
    expect(s.score).toBe(1498)
  })

  it('gives no clear bonus on a game over', () => {
    const s = calculateScore({
      ...base,
      difficulty: 'hard',
      operation: 'mixed',
      questionCount: 10,
      endReason: 'gameover',
      correctCount: 2,
      totalAnswered: 5,
      elapsedSeconds: 200,
    })
    expect(s.base).toBe(750)
    expect(s.clearMultiplier).toBe(1)
    expect(s.mistakeMultiplier).toBeCloseTo(0.7)
    expect(s.score).toBe(525)
  })

  it('values a mix by the operations in it', () => {
    const mix = (mixedOperations?: GameOutcome['mixedOperations']) =>
      calculateScore({ ...base, operation: 'mixed', mixedOperations }).base
    // all four, chosen or not, keep the full mix multiplier
    expect(mix()).toBe(750)
    expect(mix(['addition', 'subtraction', 'multiplication', 'division'])).toBe(750)
    expect(mix(['addition', 'subtraction'])).toBe(575)
    expect(mix(['multiplication', 'division'])).toBe(725)
  })

  it('scores zero when nothing was answered correctly', () => {
    const s = calculateScore({ ...base, endReason: 'gameover', correctCount: 0, totalAnswered: 3 })
    expect(s.score).toBe(0)
  })
})

describe('calculateRating', () => {
  const rate = (overrides: Partial<GameOutcome>) => {
    const outcome: GameOutcome = {
      ...base,
      questionCount: 10,
      correctCount: 10,
      totalAnswered: 10,
      ...overrides,
    }
    return calculateRating(outcome, calculateScore(outcome).score)
  }

  it('rates a fast perfect clear excellent on any settings', () => {
    expect(rate({ elapsedSeconds: 20 })).toBe('excellent')
    expect(
      rate({
        difficulty: 'hard',
        operation: 'mixed',
        questionCount: 15,
        correctCount: 15,
        totalAnswered: 15,
        elapsedSeconds: 60,
      }),
    ).toBe('excellent')
  })

  it('rates lower as mistakes and time add up', () => {
    expect(rate({ correctCount: 9, elapsedSeconds: 20 })).toBe('great')
    expect(rate({ elapsedSeconds: 120 })).toBe('great')
    expect(rate({ correctCount: 8, elapsedSeconds: 20 })).toBe('good')
    expect(rate({ correctCount: 8, elapsedSeconds: 120 })).toBe('nice')
  })

  it('gives no rating on a game over', () => {
    expect(rate({ endReason: 'gameover', correctCount: 7 })).toBeNull()
  })
})
