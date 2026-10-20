import type { HundredOperation } from '../types/game'
import type { Random } from './seededRandom'

/** Rows and columns of the grid: 10 × 10 makes the hundred cells */
export const GRID_SIZE = 10
export const CELL_COUNT = GRID_SIZE * GRID_SIZE

export const HUNDRED_OPERATIONS: readonly HundredOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
]

/**
 * The numbers down the left and across the top. Each cell is its row's number with its column's:
 * row + column, row − column or row × column.
 */
export interface HundredGrid {
  operation: HundredOperation
  rows: number[]
  columns: number[]
}

function shuffled(items: number[], random: Random): number[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 0 to 9 in some order */
function digits(random: Random): number[] {
  return shuffled(
    Array.from({ length: GRID_SIZE }, (_, i) => i),
    random,
  )
}

/** A grid with the headers shuffled; subtraction takes 10-19 down the left so no answer is negative */
export function generateGrid(
  operation: HundredOperation,
  random: Random = Math.random,
): HundredGrid {
  const rows = operation === 'subtraction' ? digits(random).map((d) => d + 10) : digits(random)
  return { operation, rows, columns: digits(random) }
}

/** The row and column of a cell; cells go left to right, then top to bottom */
export function cellPosition(index: number): { row: number; column: number } {
  return { row: Math.floor(index / GRID_SIZE), column: index % GRID_SIZE }
}

export function cellOperands(grid: HundredGrid, index: number): { a: number; b: number } {
  const { row, column } = cellPosition(index)
  return { a: grid.rows[row], b: grid.columns[column] }
}

export function cellAnswer(grid: HundredGrid, index: number): number {
  const { a, b } = cellOperands(grid, index)
  if (grid.operation === 'addition') return a + b
  if (grid.operation === 'subtraction') return a - b
  return a * b
}

/** How many of the entered answers are right; cells not yet answered count as wrong */
export function countCorrect(grid: HundredGrid, inputs: readonly (string | null)[]): number {
  return inputs.filter((input, i) => input !== null && Number(input) === cellAnswer(grid, i)).length
}

/** e.g. '1:05.3', to a tenth of a second */
export function formatLapTime(ms: number): string {
  const tenths = Math.floor(ms / 100)
  const m = Math.floor(tenths / 600)
  const s = Math.floor((tenths % 600) / 10)
  return `${m}:${s.toString().padStart(2, '0')}.${tenths % 10}`
}
