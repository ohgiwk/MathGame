import { describe, it, expect } from 'vitest'
import type { ActualOperation, GameOutcome } from '../types/game'
import { questionPoints, calculateScore, estimateScore, calculateRating } from './scoreCalculator'

const easyAddition = { difficulty: 'easy', operation: 'addition' } as const

const base: GameOutcome = {
  ...easyAddition,
  questionCount: 5,
  endReason: 'clear',
  correctCount: 5,
  totalAnswered: 5,
  elapsedSeconds: 19.5,
}

describe('questionPoints', () => {
  it('gives 150 for an easy addition answered at par (3s)', () => {
    expect(questionPoints(easyAddition, 'addition', 3)).toBe(150)
  })

  it('scales the speed bonus in a straight line, with no cap past par', () => {
    // nothing at the slow limit (9s) and beyond, up to 1.75 at no thinking time
    expect(questionPoints(easyAddition, 'addition', 9)).toBe(100)
    expect(questionPoints(easyAddition, 'addition', 60)).toBe(100)
    expect(questionPoints(easyAddition, 'addition', 6)).toBe(125)
    expect(questionPoints(easyAddition, 'addition', 0)).toBe(175)
  })

  it('lets a fraction of a second change the points', () => {
    expect(questionPoints(easyAddition, 'addition', 4)).toBeGreaterThan(
      questionPoints(easyAddition, 'addition', 4.5),
    )
  })

  it('multiplies by the difficulty and the operation', () => {
    // hard: par 12s, slow 36s; 36s leaves only the base
    expect(questionPoints({ difficulty: 'hard', operation: 'division' }, 'division', 36)).toBe(350)
    expect(
      questionPoints({ difficulty: 'normal', operation: 'multiplication' }, 'multiplication', 18),
    ).toBe(195)
  })

  it('values each question of a mix by its own operation plus the switching bonus', () => {
    const allFour = { difficulty: 'easy', operation: 'mixed' } as const
    expect(questionPoints(allFour, 'addition', 9)).toBe(130)
    expect(questionPoints(allFour, 'division', 9)).toBe(170)
    const two = { ...allFour, mixedOperations: ['addition', 'division'] as ActualOperation[] }
    expect(questionPoints(two, 'division', 9)).toBe(150)
  })
})

describe('calculateScore', () => {
  it('adds the clear and no-miss bonuses to the points', () => {
    const s = calculateScore(base, 1000)
    expect(s.points).toBe(1000)
    expect(s.clearMultiplier).toBeCloseTo(1.21)
    expect(s.score).toBe(1210)
  })

  it('gives only the clear bonus after a mistake', () => {
    expect(calculateScore({ ...base, correctCount: 4 }, 1000).score).toBe(1100)
  })

  it('gives no bonus on a game over or in an endless game', () => {
    expect(calculateScore({ ...base, endReason: 'gameover' }, 1000).score).toBe(1000)
    expect(calculateScore({ ...base, questionCount: 'endless' }, 1000).score).toBe(1000)
  })

  it('keeps the score in proportion to the points, whatever the question count', () => {
    const five = calculateScore(base, 1000).score
    const fifteen = calculateScore({ ...base, questionCount: 15 }, 3000).score
    expect(fifteen).toBe(five * 3)
  })
})

describe('estimateScore', () => {
  it('takes every correct answer at the average time per answer', () => {
    // 3s of thinking (par) plus 0.9s of feedback per answer: 5 × 150, then both bonuses
    expect(estimateScore(base)).toBe(908)
  })

  it('scores zero when nothing was answered correctly', () => {
    expect(
      estimateScore({ ...base, endReason: 'gameover', correctCount: 0, totalAnswered: 3 }),
    ).toBe(0)
  })
})

describe('calculateRating', () => {
  const tenEasy: GameOutcome = { ...base, questionCount: 10, correctCount: 10, totalAnswered: 10 }
  // a perfect clear of ten easy additions at par: 10 × 150 × 1.21
  const model = 1815
  const rate = (score: number, overrides: Partial<GameOutcome> = {}) =>
    calculateRating({ ...tenEasy, ...overrides }, score)

  it('rates by the share of a perfect game at par', () => {
    expect(rate(model)).toBe('excellent')
    expect(rate(model * 2)).toBe('excellent')
    expect(rate(model * 0.85)).toBe('excellent')
    expect(rate(model * 0.84)).toBe('great')
    expect(rate(model * 0.6)).toBe('great')
    expect(rate(model * 0.5)).toBe('good')
    expect(rate(model * 0.3)).toBe('nice')
  })

  it('gives no rating on a game over or to an endless game', () => {
    expect(rate(model, { endReason: 'gameover' })).toBeNull()
    expect(rate(model, { questionCount: 'endless' })).toBeNull()
  })
})
