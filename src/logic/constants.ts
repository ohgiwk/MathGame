import type { Difficulty, TimeLimitLength } from '../types/game'

export const MAX_LIVES = 3
export const FEEDBACK_DURATION_MS = 900

/** Seconds allowed per question when the time limit is on */
export const TIME_LIMIT_SECONDS: Record<TimeLimitLength, Record<Difficulty, number>> = {
  short: { easy: 5, normal: 10, hard: 20 },
  normal: { easy: 10, normal: 20, hard: 30 },
  long: { easy: 15, normal: 30, hard: 45 },
}
/** Questions generated at a time in endless mode */
export const ENDLESS_BATCH_SIZE = 20
