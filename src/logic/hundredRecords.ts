import type { HundredOperation, HundredRecord } from '../types/game'
import { CELL_COUNT, HUNDRED_OPERATIONS } from './hundredGrid'
import { isOneOf } from './guards'

/** Fastest time in ms with every cell right, per operation */
export type BestTimes = Partial<Record<HundredOperation, number>>

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isHundredRecord(value: unknown): value is HundredRecord {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    isCount(r.playedAt) &&
    isOneOf(HUNDRED_OPERATIONS, r.operation) &&
    isCount(r.elapsedMs) &&
    isCount(r.correctCount) &&
    r.correctCount <= CELL_COUNT
  )
}

/** Turns whatever was read from storage into records, dropping entries that are not usable */
export function parseHundredRecords(stored: unknown): HundredRecord[] {
  return Array.isArray(stored) ? stored.filter(isHundredRecord) : []
}

export function isPerfect(record: HundredRecord): boolean {
  return record.correctCount === CELL_COUNT
}

/** Each operation's fastest perfect grid; an operation never played perfectly is left out */
export function bestTimesOf(records: readonly HundredRecord[]): BestTimes {
  const best: BestTimes = {}
  for (const r of records) {
    if (!isPerfect(r)) continue
    const current = best[r.operation]
    if (current === undefined || r.elapsedMs < current) best[r.operation] = r.elapsedMs
  }
  return best
}

/** The id of each operation's best record: the first (newest) one with its best time */
export function bestRecordIds(records: readonly HundredRecord[]): Set<string> {
  const best = bestTimesOf(records)
  const ids = new Set<string>()
  const seen = new Set<HundredOperation>()
  for (const r of records) {
    if (seen.has(r.operation) || !isPerfect(r) || r.elapsedMs !== best[r.operation]) continue
    seen.add(r.operation)
    ids.add(r.id)
  }
  return ids
}

export interface HundredSummary {
  playCount: number
  perfectCount: number
  /** 0-100 over every cell played; null before any game */
  accuracy: number | null
  totalMs: number
}

export function summarizeHundred(records: readonly HundredRecord[]): HundredSummary {
  const correct = records.reduce((sum, r) => sum + r.correctCount, 0)
  return {
    playCount: records.length,
    perfectCount: records.filter(isPerfect).length,
    accuracy:
      records.length > 0 ? Math.round((correct / (records.length * CELL_COUNT)) * 100) : null,
    totalMs: records.reduce((sum, r) => sum + r.elapsedMs, 0),
  }
}
