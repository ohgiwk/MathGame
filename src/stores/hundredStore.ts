import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { HundredOperation, HundredRecord } from '../types/game'
import {
  CELL_COUNT,
  HUNDRED_OPERATIONS,
  type HundredGrid,
  generateGrid,
  cellAnswer,
  countCorrect,
} from '../logic/hundredGrid'
import {
  parseHundredRecords,
  bestRecordsOf,
  beatsBest,
  expForHundred,
  totalHundredExp,
  hundredLevel,
} from '../logic/hundredRecords'
import { isOneOf } from '../logic/guards'
import { readJson, writeJson } from '../logic/storage'
import { useGameStore } from './gameStore'

const STORAGE_KEY = 'math-kingdom:hundred'

interface Saved {
  operation: HundredOperation
  /** newest first */
  records: HundredRecord[]
}

function load(): Saved {
  const raw = readJson(STORAGE_KEY)
  const stored: Partial<Record<keyof Saved, unknown>> =
    typeof raw === 'object' && raw !== null ? raw : {}
  return {
    operation: isOneOf(HUNDRED_OPERATIONS, stored.operation) ? stored.operation : 'addition',
    records: parseHundredRecords(stored.records),
  }
}

export interface HundredPlay {
  grid: HundredGrid
  /** what was entered in each cell, in order; null until it is answered */
  inputs: (string | null)[]
  currentIndex: number
  startedAt: number
  /** set while the game is paused (quit dialog open) */
  pausedAt: number | null
  /** time spent paused so far, left out of the time */
  pausedMs: number
}

export interface HundredResult {
  grid: HundredGrid
  inputs: (string | null)[]
  elapsedMs: number
  correctCount: number
  /** the best grid before this game; undefined when there was none */
  previousBest: HundredRecord | undefined
  /** this grid took over as the best: enough cells right, faster, and with no more misses */
  isBestTime: boolean
  /** EXP this grid earned */
  gainedExp: number
  /** EXP over every grid before this one */
  expBefore: number
}

/** 百ます計算: fill a 10 × 10 grid as fast as possible */
export const useHundredStore = defineStore('hundred', () => {
  const game = useGameStore()
  const saved = load()
  /** the operation picked on the home screen, kept for the next visit */
  const operation = ref<HundredOperation>(saved.operation)
  const records = ref<HundredRecord[]>(saved.records)
  const bestRecords = computed(() => bestRecordsOf(records.value))
  const level = computed(() => hundredLevel(records.value))
  const play = ref<HundredPlay | null>(null)
  const result = ref<HundredResult | null>(null)

  function save() {
    const data: Saved = { operation: operation.value, records: records.value }
    writeJson(STORAGE_KEY, data)
  }

  function setOperation(op: HundredOperation) {
    operation.value = op
    save()
  }

  const currentAnswer = computed(() => {
    const p = play.value
    return p ? cellAnswer(p.grid, p.currentIndex) : null
  })

  /** Starts a grid with the picked operation */
  function start() {
    play.value = {
      grid: generateGrid(operation.value),
      inputs: Array(CELL_COUNT).fill(null),
      currentIndex: 0,
      startedAt: Date.now(),
      pausedAt: null,
      pausedMs: 0,
    }
    result.value = null
    game.screen = 'hundred'
  }

  /** The time taken so far, without any pause */
  function elapsedMs(now = Date.now()): number {
    const p = play.value
    if (!p) return 0
    const pausing = p.pausedAt !== null ? now - p.pausedAt : 0
    return now - p.startedAt - p.pausedMs - pausing
  }

  /** Fills the current cell and moves on; returns whether the answer was right */
  function submit(input: string): boolean {
    const p = play.value
    if (!p || p.pausedAt !== null) return false
    const correct = Number(input) === cellAnswer(p.grid, p.currentIndex)
    p.inputs[p.currentIndex] = input
    if (p.currentIndex + 1 >= CELL_COUNT) finish(p)
    else p.currentIndex++
    return correct
  }

  function finish(p: HundredPlay) {
    const ms = elapsedMs()
    const correctCount = countCorrect(p.grid, p.inputs)
    const previousBest = bestRecords.value[p.grid.operation]
    const isBestTime = beatsBest({ elapsedMs: ms, correctCount }, previousBest)
    const expBefore = totalHundredExp(records.value)
    const playedAt = Date.now()
    records.value.unshift({
      id: `${playedAt}-${Math.random().toString(36).slice(2, 8)}`,
      playedAt,
      operation: p.grid.operation,
      elapsedMs: ms,
      correctCount,
    })
    save()
    result.value = {
      grid: p.grid,
      inputs: [...p.inputs],
      elapsedMs: ms,
      correctCount,
      previousBest,
      isBestTime,
      gainedExp: expForHundred({ elapsedMs: ms, correctCount }),
      expBefore,
    }
    play.value = null
    game.screen = 'hundredResult'
  }

  function pause() {
    const p = play.value
    if (p && p.pausedAt === null) p.pausedAt = Date.now()
  }

  function resume() {
    const p = play.value
    if (!p || p.pausedAt === null) return
    p.pausedMs += Date.now() - p.pausedAt
    p.pausedAt = null
  }

  /** Deletes every record, for good; for when the records are reset */
  function clearRecords() {
    records.value = []
    save()
  }

  function openStats() {
    game.screen = 'hundredStats'
  }

  return {
    operation,
    records,
    bestRecords,
    level,
    play,
    result,
    currentAnswer,
    setOperation,
    start,
    elapsedMs,
    submit,
    pause,
    resume,
    clearRecords,
    openStats,
  }
})
