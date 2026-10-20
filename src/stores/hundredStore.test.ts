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
    expect(store.bestTimes.addition).toBe(100_000)
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
    // a grid with a miss sets no best time
    expect(store.bestTimes).toEqual({ multiplication: 100_000 })
    store.clearRecords()
    expect(store.records).toEqual([])
    expect(store.bestTimes).toEqual({})
  })

  it('keeps the best time only for a perfect grid that is faster', () => {
    const store = useHundredStore()
    store.start()
    fillGrid(store)
    store.start()
    fillGrid(store, 1, 500)
    expect(store.result?.correctCount).toBe(CELL_COUNT - 1)
    expect(store.result?.isBestTime).toBe(false)
    store.start()
    fillGrid(store, 0, 1200)
    expect(store.result?.isBestTime).toBe(false)
    expect(store.bestTimes.addition).toBe(100_000)
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
