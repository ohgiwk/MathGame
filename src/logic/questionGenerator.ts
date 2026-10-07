import type { Difficulty, Operation, ActualOperation, Question, GameSettings } from '../types/game'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getActualOperation(op: Operation): ActualOperation {
  if (op !== 'mixed') return op
  const ops: ActualOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
  return ops[randomInt(0, 3)]
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

export function generateQuestions(settings: GameSettings): Question[] {
  const usedKeys = new Set<string>()
  const questions: Question[] = []
  const MAX_ATTEMPTS = 200

  for (let i = 0; i < settings.questionCount; i++) {
    const op = getActualOperation(settings.operation)
    let q: Question | null = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      q = tryGenerate(settings.difficulty, op, usedKeys)
      if (q) break
    }
    if (q) questions.push(q)
  }

  return questions
}
