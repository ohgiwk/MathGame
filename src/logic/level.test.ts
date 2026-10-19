import { describe, it, expect } from 'vitest'
import type { GameRecord } from '../types/game'
import { MAX_LEVEL, expForScore, totalExp, expToNextLevel, levelFromExp, levelRatio } from './level'

function record(score: number): GameRecord {
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
    score,
  }
}

describe('expForScore', () => {
  it('turns ten points into one EXP, rounded', () => {
    expect(expForScore(1234)).toBe(123)
    expect(expForScore(1235)).toBe(124)
    expect(expForScore(0)).toBe(0)
  })
})

describe('totalExp', () => {
  it('adds up the EXP of every game', () => {
    expect(totalExp([record(1004), record(996)])).toBe(200)
    expect(totalExp([])).toBe(0)
  })
})

describe('expToNextLevel', () => {
  it('needs more EXP the higher the level', () => {
    expect(expToNextLevel(1)).toBe(50)
    for (let level = 1; level < MAX_LEVEL - 1; level++) {
      expect(expToNextLevel(level + 1)).toBeGreaterThan(expToNextLevel(level))
    }
  })
})

describe('levelFromExp', () => {
  it('starts at level 1', () => {
    expect(levelFromExp(0)).toEqual({ level: 1, expInLevel: 0, expForLevel: 50, isMax: false })
  })
  it('moves up a level once its EXP is reached', () => {
    expect(levelFromExp(49).level).toBe(1)
    expect(levelFromExp(50)).toEqual({ level: 2, expInLevel: 0, expForLevel: 60, isMax: false })
    expect(levelFromExp(115)).toEqual({ level: 3, expInLevel: 5, expForLevel: 70, isMax: false })
  })
  it('stops at the top level', () => {
    const top = levelFromExp(Number.MAX_SAFE_INTEGER)
    expect(top).toEqual({ level: MAX_LEVEL, expInLevel: 0, expForLevel: 0, isMax: true })
    expect(levelRatio(top)).toBe(1)
  })
})
