import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHundredStore } from './hundredStore'
import { useGameStore } from './gameStore'
import { CELL_COUNT, cellAnswer } from '../logic/hundredGrid'

/** Answers every cell, the first `wrong` of them wrongly, `msPerCell` apart */
function fillGrid(store: ReturnType<typeof useHundredStore>, wrong = 0, msPerCell = 1000) {
  for (let i = 0; i < CELL_COUNT; i++) {
    vi.advanceTimersByTime(msPerCell)
    const answer = cellAnswer(store.play!.grid, i)
    store.submit(String(i < wrong ? answer + 1 : answer))
  }
}

describe('hundredStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fills the cells in order and shows the result after the last one', () => {
    const store = useHundredStore()
    store.start()
    expect(useGameStore().screen).toBe('hundred')
    fillGrid(store)
    expect(useGameStore().screen).toBe('hundredResult')
    expect(store.result).toMatchObject({ correctCount: CELL_COUNT, elapsedMs: 100_000 })
    expect(store.result?.isBestTime).toBe(true)
    expect(store.bestRecords.addition?.elapsedMs).toBe(100_000)
    expect(store.records).toMatchObject([
      { operation: 'addition', elapsedMs: 100_000, correctCount: CELL_COUNT },
    ])
  })

  it('saves every finished grid, newest first, until the records are reset', () => {
    const store = useHundredStore()
    store.start()
    fillGrid(store, 3)
    store.setOperation('multiplication')
    store.start()
    fillGrid(store)
    expect(store.records.map((r) => [r.operation, r.correctCount])).toEqual([
      ['multiplication', CELL_COUNT],
      ['addition', CELL_COUNT - 3],
    ])
    // a grid with a few misses sets a best time too
    expect(store.bestRecords.addition?.correctCount).toBe(CELL_COUNT - 3)
    expect(store.bestRecords.multiplication?.correctCount).toBe(CELL_COUNT)
    store.clearRecords()
    expect(store.records).toEqual([])
    expect(store.bestRecords).toEqual({})
  })

  it('updates the best only for a faster grid with no more misses and 90 cells right', () => {
    const store = useHundredStore()
    const best = () => [
      store.bestRecords.addition?.elapsedMs,
      store.bestRecords.addition?.correctCount,
    ]
    store.start()
    fillGrid(store, 2)
    expect(best()).toEqual([100_000, CELL_COUNT - 2])
    // faster, but more misses
    store.start()
    fillGrid(store, 3, 500)
    expect(store.result?.isBestTime).toBe(false)
    expect(best()).toEqual([100_000, CELL_COUNT - 2])
    // fewer misses, but slower
    store.start()
    fillGrid(store, 0, 1200)
    expect(store.result?.isBestTime).toBe(false)
    // faster with the same misses
    store.start()
    fillGrid(store, 2, 500)
    expect(store.result?.isBestTime).toBe(true)
    expect(store.result?.previousBest?.elapsedMs).toBe(100_000)
    expect(best()).toEqual([50_000, CELL_COUNT - 2])
    // too many misses: not a best time, however fast
    store.clearRecords()
    store.start()
    fillGrid(store, 11, 100)
    expect(store.result?.isBestTime).toBe(false)
    expect(store.bestRecords).toEqual({})
  })

  it('earns EXP with each grid and builds up the level', () => {
    const store = useHundredStore()
    store.start()
    fillGrid(store)
    // 100 right, no miss, 200 seconds under 5 minutes
    expect(store.result).toMatchObject({ expBefore: 0, gainedExp: 350 })
    expect(store.level.level).toBe(2)
    store.start()
    fillGrid(store, 100)
    expect(store.result).toMatchObject({ expBefore: 350, gainedExp: 0 })
    store.clearRecords()
    expect(store.level.level).toBe(1)
  })

  it('leaves time spent paused out of the time', () => {
    const store = useHundredStore()
    store.start()
    store.pause()
    vi.advanceTimersByTime(30_000)
    expect(store.submit('0')).toBe(false)
    store.resume()
    fillGrid(store)
    expect(store.result?.elapsedMs).toBe(100_000)
  })
})
