import type { Difficulty, Operation, GameRecord, GameOutcome } from '../types/game'
import { OPERATIONS, resolveMixedOperations } from './labels'

export interface StatsSummary {
  playCount: number
  clearCount: number
  totalAnswered: number
  correctCount: number
  /** 0-100, null when nothing has been answered yet */
  accuracy: number | null
  elapsedSeconds: number
  /** average seconds per answered question, null when nothing has been answered yet */
  secondsPerQuestion: number | null
  totalScore: number
  /** null when there are no records */
  bestScore: number | null
}

export function summarize(records: GameRecord[]): StatsSummary {
  let clearCount = 0
  let totalAnswered = 0
  let correctCount = 0
  let elapsedSeconds = 0
  let totalScore = 0
  let bestScore: number | null = null

  for (const r of records) {
    if (r.endReason === 'clear') clearCount++
    totalAnswered += r.totalAnswered
    correctCount += r.correctCount
    elapsedSeconds += r.elapsedSeconds
    totalScore += r.score
    bestScore = Math.max(bestScore ?? 0, r.score)
  }

  return {
    playCount: records.length,
    clearCount,
    totalAnswered,
    correctCount,
    accuracy: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null,
    elapsedSeconds,
    secondsPerQuestion: totalAnswered > 0 ? elapsedSeconds / totalAnswered : null,
    totalScore,
    bestScore,
  }
}

export function recordsFor(
  records: GameRecord[],
  difficulty: Difficulty,
  operation: Operation,
): GameRecord[] {
  return records.filter((r) => r.difficulty === difficulty && r.operation === operation)
}

export function summarizeByOperation(
  records: GameRecord[],
  difficulty: Difficulty,
): { operation: Operation; summary: StatsSummary }[] {
  return OPERATIONS.map((operation) => ({
    operation,
    summary: summarize(recordsFor(records, difficulty, operation)),
  }))
}

/**
 * Identifies a game's kind: difficulty, operation, question count and, for a mix, its set of
 * operations. Games of one kind are scored alike, so their scores can be compared and averaged.
 */
export function kindKey(outcome: GameOutcome): string {
  const mix = outcome.operation === 'mixed' ? resolveMixedOperations(outcome.mixedOperations) : []
  return [outcome.difficulty, outcome.operation, outcome.questionCount, mix.join('+')].join('|')
}

/** Records of the same kind as `outcome` (see kindKey). Keeps the order of `records`. */
export function recordsLike(records: GameRecord[], outcome: GameOutcome): GameRecord[] {
  const kind = kindKey(outcome)
  return records.filter((r) => kindKey(r) === kind)
}
