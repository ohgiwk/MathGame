import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Difficulty, Operation, GameRecord } from '../types/game'
import { calculateScore } from '../logic/scoreCalculator'

const STORAGE_KEY = 'math-kingdom:records'

function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (
      parsed
        .filter(
          (r): r is GameRecord =>
            !!r &&
            typeof r.playedAt === 'number' &&
            typeof r.correctCount === 'number' &&
            typeof r.totalAnswered === 'number' &&
            typeof r.elapsedSeconds === 'number',
        )
        // records saved before scoring existed get their score from the same formula
        .map((r) => (typeof r.score === 'number' ? r : { ...r, score: calculateScore(r).score }))
    )
  } catch {
    return []
  }
}

export const useStatsStore = defineStore('stats', () => {
  // newest first
  const records = ref<GameRecord[]>(loadRecords())

  function addRecord(record: Omit<GameRecord, 'id' | 'playedAt'>) {
    const playedAt = Date.now()
    records.value.unshift({
      ...record,
      id: `${playedAt}-${Math.random().toString(36).slice(2, 8)}`,
      playedAt,
    })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    } catch {
      // storage unavailable or full: keep the records in memory for this session
    }
  }

  function bestScore(difficulty: Difficulty, operation: Operation): number {
    return records.value
      .filter((r) => r.difficulty === difficulty && r.operation === operation)
      .reduce((best, r) => Math.max(best, r.score), 0)
  }

  return { records, addRecord, bestScore }
})
