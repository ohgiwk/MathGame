import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Difficulty, Operation, GameRecord } from '../types/game'
import { parseRecords } from '../logic/recordParser'
import { summarize, recordsFor } from '../logic/statsCalculator'

const STORAGE_KEY = 'math-kingdom:records'

function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? parseRecords(JSON.parse(raw)) : []
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

  /** 0 when the combination has never been played */
  function bestScore(difficulty: Difficulty, operation: Operation): number {
    return summarize(recordsFor(records.value, difficulty, operation)).bestScore ?? 0
  }

  return { records, addRecord, bestScore }
})
