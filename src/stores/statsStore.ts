import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { GameRecord } from '../types/game'

const STORAGE_KEY = 'math-kingdom:records'

function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is GameRecord =>
        !!r &&
        typeof r.playedAt === 'number' &&
        typeof r.correctCount === 'number' &&
        typeof r.totalAnswered === 'number' &&
        typeof r.elapsedSeconds === 'number',
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
    records.value.unshift({ ...record, id: `${playedAt}-${Math.random().toString(36).slice(2, 8)}`, playedAt })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    } catch {
      // storage unavailable or full: keep the records in memory for this session
    }
  }

  return { records, addRecord }
})
