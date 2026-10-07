import { describe, it, expect } from 'vitest'
import { calculateScore, formatScore, type ScoreInput } from './scoreCalculator'

const base: ScoreInput = {
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

  it('scores zero when nothing was answered correctly', () => {
    const s = calculateScore({ ...base, endReason: 'gameover', correctCount: 0, totalAnswered: 3 })
    expect(s.score).toBe(0)
  })
})

describe('formatScore', () => {
  it('groups thousands', () => {
    expect(formatScore(1234567)).toBe('1,234,567')
  })
})
