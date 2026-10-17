import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatsStore } from './statsStore'

const outcome = {
  difficulty: 'easy',
  operation: 'addition',
  questionCount: 5,
  endReason: 'clear',
  correctCount: 5,
  totalAnswered: 5,
  elapsedSeconds: 20,
  score: 600,
} as const

describe('statsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clearRecords deletes every record', () => {
    const stats = useStatsStore()
    stats.addRecord(outcome)
    stats.addRecord(outcome)
    expect(stats.records).toHaveLength(2)
    stats.clearRecords()
    expect(stats.records).toEqual([])
    expect(stats.bestScore('easy', 'addition')).toBe(0)
  })
})
