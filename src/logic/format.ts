import type { Question } from '../types/game'
import { OPERATOR_SYMBOLS, WEEKDAY_LABELS } from './labels'
import { type DayKey, parseDayKey } from './dailyStats'

export function formatQuestion(q: Question): string {
  return `${q.operandA} ${OPERATOR_SYMBOLS[q.operation]} ${q.operandB}`
}

export function formatScore(score: number): string {
  return score.toLocaleString('ja-JP')
}

/** Whole seconds only; the fraction is dropped */
export function formatElapsedTime(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

/** Average time per question, to a tenth of a second; null when nothing was answered */
export function formatAverageTime(totalSeconds: number, answered: number): string | null {
  if (answered <= 0) return null
  const average = Math.round((totalSeconds / answered) * 10) / 10
  if (average >= 60) return formatElapsedTime(average)
  return `${average.toFixed(1)}秒`
}

export function formatTotalTime(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

export function formatPlayedDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** e.g. '3月5日（木）' */
export function formatDayHeading(key: DayKey): string {
  const { year, month, date } = parseDayKey(key)
  const weekday = WEEKDAY_LABELS[new Date(year, month, date).getDay()]
  return `${month + 1}月${date}日（${weekday}）`
}

/** e.g. '3/5' */
export function formatShortDay(key: DayKey): string {
  const { month, date } = parseDayKey(key)
  return `${month + 1}/${date}`
}
