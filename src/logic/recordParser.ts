import type { GameEndReason, GameRecord } from '../types/game'
import {
  ACTUAL_OPERATIONS,
  DIFFICULTIES,
  MIN_MIXED_OPERATIONS,
  OPERATIONS,
  RECORDED_QUESTION_COUNTS,
} from './labels'
import { estimateScore } from './scoreCalculator'
import { isOneOf } from './guards'

const END_REASONS: GameEndReason[] = ['clear', 'gameover']

type StoredRecord = Omit<GameRecord, 'score'> & { score?: unknown }

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

/** Absent on non-mixed games and on mixes saved before the operations could be chosen */
function isMixedOperations(value: unknown): boolean {
  if (value === undefined) return true
  return (
    Array.isArray(value) &&
    value.length >= MIN_MIXED_OPERATIONS &&
    value.every((op) => isOneOf(ACTUAL_OPERATIONS, op))
  )
}

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    isCount(r.playedAt) &&
    isOneOf(DIFFICULTIES, r.difficulty) &&
    isOneOf(OPERATIONS, r.operation) &&
    isMixedOperations(r.mixedOperations) &&
    isOneOf(RECORDED_QUESTION_COUNTS, r.questionCount) &&
    isOneOf(END_REASONS, r.endReason) &&
    isCount(r.correctCount) &&
    isCount(r.totalAnswered) &&
    isCount(r.elapsedSeconds)
  )
}

/** Turns whatever was read from storage into records, dropping entries that are not usable. */
export function parseRecords(stored: unknown): GameRecord[] {
  if (!Array.isArray(stored)) return []
  return stored.filter(isStoredRecord).map((entry) => {
    const r: StoredRecord & { answerSeconds?: unknown } = { ...entry }
    // answer times were saved with records for a while; they are no longer kept
    delete r.answerSeconds
    return {
      ...r,
      // records saved before scoring existed get an estimate of their score
      score: isCount(r.score) ? r.score : estimateScore(r),
    }
  })
}
