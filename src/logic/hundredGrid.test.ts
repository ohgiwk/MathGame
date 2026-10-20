import { describe, it, expect } from 'vitest'
import {
  generateGrid,
  cellAnswer,
  cellPosition,
  countCorrect,
  formatLapTime,
  CELL_COUNT,
} from './hundredGrid'
import { seededRandom } from './seededRandom'

const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)
const ZERO_TO_NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

describe('generateGrid', () => {
  it('puts each of 0-9 once along both sides', () => {
    const grid = generateGrid('addition', seededRandom('a'))
    expect(sorted(grid.rows)).toEqual(ZERO_TO_NINE)
    expect(sorted(grid.columns)).toEqual(ZERO_TO_NINE)
  })

  it('takes 10-19 down the left for subtraction, so no answer is negative', () => {
    const grid = generateGrid('subtraction', seededRandom('s'))
    expect(sorted(grid.rows)).toEqual(ZERO_TO_NINE.map((d) => d + 10))
    for (let i = 0; i < CELL_COUNT; i++) expect(cellAnswer(grid, i)).toBeGreaterThanOrEqual(1)
  })
})

describe('cells', () => {
  const grid = { operation: 'multiplication' as const, rows: ZERO_TO_NINE, columns: ZERO_TO_NINE }

  it('go left to right, then top to bottom', () => {
    expect(cellPosition(0)).toEqual({ row: 0, column: 0 })
    expect(cellPosition(13)).toEqual({ row: 1, column: 3 })
    expect(cellPosition(99)).toEqual({ row: 9, column: 9 })
  })

  it('answer with the row number and the column number', () => {
    expect(cellAnswer(grid, 13)).toBe(3)
    expect(cellAnswer(grid, 99)).toBe(81)
    expect(cellAnswer({ ...grid, operation: 'addition' }, 99)).toBe(18)
    expect(cellAnswer({ ...grid, operation: 'subtraction' }, 93)).toBe(6)
  })

  it('count only the right answers as correct', () => {
    expect(countCorrect(grid, ['0', '1', '0', null])).toBe(2)
  })
})

describe('formatLapTime', () => {
  it('shows minutes, seconds and tenths', () => {
    expect(formatLapTime(0)).toBe('0:00.0')
    expect(formatLapTime(65_349)).toBe('1:05.3')
  })
})
