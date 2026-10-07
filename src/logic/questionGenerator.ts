import type { Difficulty, Operation, ActualOperation, Question, GameSettings } from '../types/game'
import { OPERATOR_SYMBOLS } from './labels'

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

function tryGenerate(
  difficulty: Difficulty,
  op: ActualOperation,
  usedKeys: Set<string>,
): Question | null {
  let operandA: number
  let operandB: number
  let answer: number

  if (op === 'addition') {
    const range = difficulty === 'easy' ? [1, 9] : difficulty === 'normal' ? [10, 99] : [10, 999]
    operandA = randomInt(range[0], range[1])
    operandB = randomInt(range[0], range[1])
    answer = operandA + operandB
  } else if (op === 'subtraction') {
    const range = difficulty === 'easy' ? [1, 9] : difficulty === 'normal' ? [10, 99] : [10, 999]
    operandA = randomInt(range[0], range[1])
    operandB = randomInt(range[0], range[1])
    if (operandB > operandA) {
      const tmp = operandA
      operandA = operandB
      operandB = tmp
    }
    answer = operandA - operandB
  } else if (op === 'multiplication') {
    const rangeA = difficulty === 'easy' ? [1, 9] : difficulty === 'normal' ? [2, 12] : [10, 99]
    const rangeB = difficulty === 'easy' ? [1, 9] : difficulty === 'normal' ? [2, 12] : [2, 9]
    operandA = randomInt(rangeA[0], rangeA[1])
    operandB = randomInt(rangeB[0], rangeB[1])
    answer = operandA * operandB
  } else {
    // division: generate quotient × divisor to guarantee integer result
    const quotientRange =
      difficulty === 'easy' ? [1, 9] : difficulty === 'normal' ? [2, 12] : [10, 99]
    const divisorRange = [2, 9]
    const quotient = randomInt(quotientRange[0], quotientRange[1])
    const divisor = randomInt(divisorRange[0], divisorRange[1])
    operandA = quotient * divisor
    operandB = divisor
    answer = quotient
  }

  const key = canonKey(operandA, operandB, op)
  if (usedKeys.has(key)) return null

  usedKeys.add(key)
  return { id: key, operandA, operandB, operation: op, answer }
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

export function formatQuestion(q: Question): string {
  return `${q.operandA} ${OPERATOR_SYMBOLS[q.operation]} ${q.operandB}`
}
