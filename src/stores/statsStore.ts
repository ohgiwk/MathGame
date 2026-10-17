import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Difficulty, Operation, GameRecord } from '../types/game'
import { parseRecords } from '../logic/recordParser'
import { summarize, recordsFor } from '../logic/statsCalculator'
import { readJson, writeJson, removeKey } from '../logic/storage'

const STORAGE_KEY = 'math-kingdom:records'

export const useStatsStore = defineStore('stats', () => {
  // newest first
  const records = ref<GameRecord[]>(parseRecords(readJson(STORAGE_KEY)))

  function addRecord(record: Omit<GameRecord, 'id' | 'playedAt'>) {
    const playedAt = Date.now()
    records.value.unshift({
      ...record,
      id: `${playedAt}-${Math.random().toString(36).slice(2, 8)}`,
      playedAt,
    })
    writeJson(STORAGE_KEY, records.value)
  }

  /** Deletes every record, for good */
  function clearRecords() {
    records.value = []
    removeKey(STORAGE_KEY)
  }

  /**
   * 0 when the combination has never been played. Endless games are only compared with each
   * other, since a long endless run would otherwise outscore any fixed-length game.
   */
  function bestScore(difficulty: Difficulty, operation: Operation, endless = false): number {
    const same = recordsFor(records.value, difficulty, operation).filter(
      (r) => (r.questionCount === 'endless') === endless,
    )
    return summarize(same).bestScore ?? 0
  }

  return { records, addRecord, clearRecords, bestScore }
})
