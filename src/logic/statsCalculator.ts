import type { Difficulty, Operation, GameRecord } from '../types/game'
import { OPERATIONS } from './labels'

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
}

export function summarize(records: GameRecord[]): StatsSummary {
  let clearCount = 0
  let totalAnswered = 0
  let correctCount = 0
  let elapsedSeconds = 0

  for (const r of records) {
    if (r.endReason === 'clear') clearCount++
    totalAnswered += r.totalAnswered
    correctCount += r.correctCount
    elapsedSeconds += r.elapsedSeconds
  }

  return {
    playCount: records.length,
    clearCount,
    totalAnswered,
    correctCount,
    accuracy: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null,
    elapsedSeconds,
    secondsPerQuestion: totalAnswered > 0 ? elapsedSeconds / totalAnswered : null,
  }
}

export function summarizeByOperation(
  records: GameRecord[],
  difficulty: Difficulty,
): { operation: Operation; summary: StatsSummary }[] {
  return OPERATIONS.map((operation) => ({
    operation,
    summary: summarize(
      records.filter((r) => r.difficulty === difficulty && r.operation === operation),
    ),
  }))
}

export function formatTotalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

export function formatPlayedAt(timestamp: number): string {
  const d = new Date(timestamp)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}
