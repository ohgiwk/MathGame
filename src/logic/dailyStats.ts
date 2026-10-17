import type { GameRecord } from '../types/game'
import { summarize, kindKey, type StatsSummary } from './statsCalculator'

/** A local calendar day as 'YYYY-MM-DD' */
export type DayKey = string

export interface DaySummary extends StatsSummary {
  day: DayKey
  /** rounded mean score of the day's games */
  averageScore: number
}

export function dayKey(timestamp: number): DayKey {
  const d = new Date(timestamp)
  return toDayKey(d.getFullYear(), d.getMonth(), d.getDate())
}

/** month is 0-based, as in Date */
export function toDayKey(year: number, month: number, date: number): DayKey {
  const mm = (month + 1).toString().padStart(2, '0')
  const dd = date.toString().padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** One summary per day that has at least one game, oldest first. */
export function summarizeByDay(records: GameRecord[]): DaySummary[] {
  const byDay = new Map<DayKey, GameRecord[]>()
  for (const r of records) {
    const key = dayKey(r.playedAt)
    const list = byDay.get(key)
    if (list) list.push(r)
    else byDay.set(key, [r])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, list]) => {
      const summary = summarize(list)
      return {
        ...summary,
        day,
        averageScore: Math.round(summary.totalScore / summary.playCount),
      }
    })
}

/** One kind of game (see kindKey) as played on one day */
export interface KindDay {
  kind: string
  /** the day's games of this kind, in the order given (newest first, as stored) */
  records: GameRecord[]
  summary: DaySummary
  /** this kind's average on the last earlier day it was played; null on its first day */
  previousAverage: number | null
}

/** The given day's games split by kind, the most recently played kind first. */
export function summarizeDayByKind(records: GameRecord[], day: DayKey): KindDay[] {
  const byKind = new Map<string, GameRecord[]>()
  for (const r of records) {
    const kind = kindKey(r)
    const list = byKind.get(kind)
    if (list) list.push(r)
    else byKind.set(kind, [r])
  }
  const result: { kind: KindDay; latest: number }[] = []
  for (const [kind, list] of byKind) {
    const days = summarizeByDay(list)
    const i = days.findIndex((d) => d.day === day)
    if (i < 0) continue
    const dayRecords = list.filter((r) => dayKey(r.playedAt) === day)
    result.push({
      kind: {
        kind,
        records: dayRecords,
        summary: days[i],
        previousAverage: i > 0 ? days[i - 1].averageScore : null,
      },
      latest: Math.max(...dayRecords.map((r) => r.playedAt)),
    })
  }
  return result.sort((a, b) => b.latest - a.latest).map((r) => r.kind)
}

/** The weeks of a month for a Sunday-first calendar; days outside the month are null. */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstWeekday).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Consecutive days with play, ending today or yesterday (a streak survives until a full day is missed). */
export function currentStreak(playedDays: ReadonlySet<DayKey>, now: number): number {
  const d = new Date(now)
  if (!playedDays.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1)
  let streak = 0
  while (playedDays.has(dayKey(d.getTime()))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
