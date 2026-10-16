import type { Difficulty, ActualOperation, Question, GameSettings } from '../types/game'
import { resolveMixedOperations } from './labels'
import { ENDLESS_BATCH_SIZE } from './constants'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getActualOperation(settings: GameSettings): ActualOperation {
  if (settings.operation !== 'mixed') return settings.operation
  const ops = resolveMixedOperations(settings.mixedOperations)
  return ops[randomInt(0, ops.length - 1)]
}

function canonKey(a: number, b: number, op: ActualOperation): string {
  if (op === 'addition' || op === 'multiplication') {
    return `${Math.min(a, b)}-${op}-${Math.max(a, b)}`
  }
  return `${a}-${op}-${b}`
}

type Range = readonly [min: number, max: number]
type DrawRanges = Record<Difficulty, { x: Range; y: Range }>

const SUM_RANGES: DrawRanges = {
  easy: { x: [1, 9], y: [1, 9] },
  normal: { x: [10, 99], y: [10, 99] },
  hard: { x: [10, 999], y: [10, 999] },
}

/**
 * The two random draws (x, y) behind a question, per operation and difficulty.
 * Addition, subtraction and multiplication draw the operands themselves;
 * division draws the quotient (x) and the divisor (y) so the result is always an integer.
 */
const DRAW_RANGES: Record<ActualOperation, DrawRanges> = {
  addition: SUM_RANGES,
  subtraction: SUM_RANGES,
  multiplication: {
    easy: { x: [1, 9], y: [1, 9] },
    normal: { x: [2, 12], y: [2, 12] },
    hard: { x: [10, 99], y: [2, 9] },
  },
  division: {
    easy: { x: [1, 9], y: [2, 9] },
    normal: { x: [2, 12], y: [2, 9] },
    hard: { x: [10, 99], y: [2, 9] },
  },
}

function buildQuestion(op: ActualOperation, x: number, y: number): Omit<Question, 'id'> {
  switch (op) {
    case 'addition':
      return { operation: op, operandA: x, operandB: y, answer: x + y }
    case 'subtraction': {
      // larger operand first so the answer is never negative
      const operandA = Math.max(x, y)
      const operandB = Math.min(x, y)
      return { operation: op, operandA, operandB, answer: operandA - operandB }
    }
    case 'multiplication':
      return { operation: op, operandA: x, operandB: y, answer: x * y }
    case 'division':
      return { operation: op, operandA: x * y, operandB: y, answer: x }
  }
}

function tryGenerate(
  difficulty: Difficulty,
  op: ActualOperation,
  usedKeys: Set<string>,
): Question | null {
  const ranges = DRAW_RANGES[op][difficulty]
  const question = buildQuestion(op, randomInt(...ranges.x), randomInt(...ranges.y))

  const key = canonKey(question.operandA, question.operandB, op)
  if (usedKeys.has(key)) return null

  usedKeys.add(key)
  return { id: key, ...question }
}

const MAX_ATTEMPTS = 200

function generateOne(difficulty: Difficulty, op: ActualOperation, usedKeys: Set<string>) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const q = tryGenerate(difficulty, op, usedKeys)
    if (q) return q
  }
  return null
}

/**
 * Questions that repeat none of `usedKeys`, which collects every key asked so far; pass the same
 * set again to continue a game (endless mode). Once the pool runs dry it starts over, still never
 * repeating the question just asked.
 */
export function generateQuestions(
  settings: GameSettings,
  count: number = settings.questionCount === 'endless'
    ? ENDLESS_BATCH_SIZE
    : settings.questionCount,
  usedKeys: Set<string> = new Set(),
): Question[] {
  const questions: Question[] = []

  for (let i = 0; i < count; i++) {
    const op = getActualOperation(settings)
    let q = generateOne(settings.difficulty, op, usedKeys)
    if (!q) {
      const last = [...usedKeys].at(-1)
      usedKeys.clear()
      if (last) usedKeys.add(last)
      q = generateOne(settings.difficulty, op, usedKeys)
    }
    if (q) questions.push(q)
  }

  return questions
}
