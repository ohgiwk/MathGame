import type { HundredOperation, HundredRecord } from '../types/game'
import { CELL_COUNT, HUNDRED_OPERATIONS } from './hundredGrid'
import { isOneOf } from './guards'
import { levelFromExp, type LevelProgress } from './level'

/** Each operation's best grid: its time and its misses together */
export type BestRecords = Partial<Record<HundredOperation, HundredRecord>>

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

/** A grid needs at least this many cells right for its time to count as a best time */
export const BEST_TIME_MIN_CORRECT = 90

/** Whether a grid's time can be a best time: a few misses are allowed, but not many */
export function countsForBestTime(record: Pick<HundredRecord, 'correctCount'>): boolean {
  return record.correctCount >= BEST_TIME_MIN_CORRECT
}

export function missCount(record: Pick<HundredRecord, 'correctCount'>): number {
  return CELL_COUNT - record.correctCount
}

/**
 * Whether a grid takes over as the best from `best`: it needs enough cells right, and must be
 * faster with no more misses. A faster grid with more misses leaves the best as it was.
 */
export function beatsBest(
  record: Pick<HundredRecord, 'elapsedMs' | 'correctCount'>,
  best: HundredRecord | undefined,
): boolean {
  if (!countsForBestTime(record)) return false
  if (best === undefined) return true
  return record.elapsedMs < best.elapsedMs && missCount(record) <= missCount(best)
}

/** Each operation's best grid; an operation without one is left out */
export function bestRecordsOf(records: readonly HundredRecord[]): BestRecords {
  const best: BestRecords = {}
  // oldest first, the order they were played in: a best only gives way to a later grid beating it
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i]
    if (beatsBest(r, best[r.operation])) best[r.operation] = r
  }
  return best
}

/** The id of each operation's best record */
export function bestRecordIds(records: readonly HundredRecord[]): Set<string> {
  return new Set(Object.values(bestRecordsOf(records)).map((r) => r.id))
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

/** EXP for every grid filled with no miss */
const PERFECT_BONUS_EXP = 50
/** A grid finished faster than this earns 1 EXP for each second left over */
const SPEED_BONUS_LIMIT_MS = 300_000

/**
 * The EXP a grid earns: 1 for each cell right, a bonus for no miss, and a speed bonus for the
 * seconds under five minutes. The speed bonus shrinks with the misses, so a fast grid of wrong
 * answers earns little.
 */
export function expForHundred(record: Pick<HundredRecord, 'elapsedMs' | 'correctCount'>): number {
  const perfect = record.correctCount === CELL_COUNT ? PERFECT_BONUS_EXP : 0
  const secondsLeft = Math.max(SPEED_BONUS_LIMIT_MS - record.elapsedMs, 0) / 1000
  const speed = Math.round(secondsLeft * (record.correctCount / CELL_COUNT))
  return record.correctCount + perfect + speed
}

/** EXP earned over every grid played so far */
export function totalHundredExp(records: readonly HundredRecord[]): number {
  return records.reduce((sum, r) => sum + expForHundred(r), 0)
}

/** The 百ます計算 level, kept apart from the one the other games build up */
export function hundredLevel(records: readonly HundredRecord[]): LevelProgress {
  return levelFromExp(totalHundredExp(records))
}
