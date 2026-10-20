import type { GameRecord } from '../types/game'

export const MAX_LEVEL = 999

/** A game's score is worth this many points per EXP */
const SCORE_PER_EXP = 10

/** The EXP a game earns, from its score */
export function expForScore(score: number): number {
  return Math.max(Math.round(score / SCORE_PER_EXP), 0)
}

/** EXP earned over every game played so far */
export function totalExp(records: GameRecord[]): number {
  return records.reduce((sum, r) => sum + expForScore(r.score), 0)
}

/**
 * EXP needed to go from `level` to the next one. A beginner goes up a level every few games,
 * and each level after needs a little more, growing faster the higher it gets.
 */
export function expToNextLevel(level: number): number {
  const n = level - 1
  return 200 + 40 * n + Math.floor((n * n) / 5)
}

/** EXP needed to reach each level from zero, indexed by level (1 needs nothing) */
const LEVEL_START_EXP: number[] = [0, 0]
for (let level = 1; level < MAX_LEVEL; level++) {
  LEVEL_START_EXP.push(LEVEL_START_EXP[level] + expToNextLevel(level))
}

export interface LevelProgress {
  level: number
  /** EXP gathered since reaching this level */
  expInLevel: number
  /** EXP this level needs to reach the next; 0 at the top level */
  expForLevel: number
  isMax: boolean
}

export function levelFromExp(exp: number): LevelProgress {
  // the highest level whose starting EXP has been reached
  let lo = 1
  let hi = MAX_LEVEL
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (LEVEL_START_EXP[mid] <= exp) lo = mid
    else hi = mid - 1
  }
  if (lo === MAX_LEVEL) return { level: MAX_LEVEL, expInLevel: 0, expForLevel: 0, isMax: true }
  return {
    level: lo,
    expInLevel: exp - LEVEL_START_EXP[lo],
    expForLevel: expToNextLevel(lo),
    isMax: false,
  }
}

/** 0-1: how far through the level, full at the top level */
export function levelRatio(progress: LevelProgress): number {
  return progress.isMax ? 1 : progress.expInLevel / progress.expForLevel
}
