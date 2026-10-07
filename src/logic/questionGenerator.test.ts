import { describe, it, expect } from 'vitest'
import type { ActualOperation, Difficulty, Question } from '../types/game'
import { DIFFICULTIES, OPERATIONS } from './labels'
import { generateQuestions, formatQuestion } from './questionGenerator'

// generation is random, so every property is checked over many runs
const RUNS = 30

function generate(difficulty: Difficulty, operation: (typeof OPERATIONS)[number]): Question[] {
  return Array.from({ length: RUNS }, () =>
    generateQuestions({ questionCount: 15, difficulty, operation }),
  ).flat()
}

function expectInRange(value: number, [min, max]: [number, number]) {
  expect(value).toBeGreaterThanOrEqual(min)
  expect(value).toBeLessThanOrEqual(max)
}

describe('generateQuestions', () => {
  it.each(DIFFICULTIES.flatMap((d) => OPERATIONS.map((op) => [d, op] as const)))(
    '%s %s: returns the requested number of distinct questions',
    (difficulty, operation) => {
      for (let run = 0; run < RUNS; run++) {
        const questions = generateQuestions({ questionCount: 15, difficulty, operation })
        expect(questions).toHaveLength(15)
        expect(new Set(questions.map((q) => q.id)).size).toBe(15)
        if (operation !== 'mixed') {
          expect(questions.every((q) => q.operation === operation)).toBe(true)
        }
      }
    },
  )

  it.each(DIFFICULTIES)('%s: every answer matches its operands', (difficulty) => {
    const compute: Record<ActualOperation, (a: number, b: number) => number> = {
      addition: (a, b) => a + b,
      subtraction: (a, b) => a - b,
      multiplication: (a, b) => a * b,
      division: (a, b) => a / b,
    }
    for (const q of generate(difficulty, 'mixed')) {
      expect(q.answer).toBe(compute[q.operation](q.operandA, q.operandB))
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThanOrEqual(0)
    }
  })

  it.each<[Difficulty, [number, number]]>([
    ['easy', [1, 9]],
    ['normal', [10, 99]],
    ['hard', [10, 999]],
  ])('%s addition and subtraction draw both operands from the same range', (difficulty, range) => {
    for (const q of [...generate(difficulty, 'addition'), ...generate(difficulty, 'subtraction')]) {
      expectInRange(q.operandA, range)
      expectInRange(q.operandB, range)
    }
  })

  it.each<[Difficulty, [number, number], [number, number]]>([
    ['easy', [1, 9], [1, 9]],
    ['normal', [2, 12], [2, 12]],
    ['hard', [10, 99], [2, 9]],
  ])('%s multiplication keeps each operand in its range', (difficulty, rangeA, rangeB) => {
    for (const q of generate(difficulty, 'multiplication')) {
      expectInRange(q.operandA, rangeA)
      expectInRange(q.operandB, rangeB)
    }
  })

  it.each<[Difficulty, [number, number]]>([
    ['easy', [1, 9]],
    ['normal', [2, 12]],
    ['hard', [10, 99]],
  ])('%s division keeps the quotient in range and the divisor in 2-9', (difficulty, range) => {
    for (const q of generate(difficulty, 'division')) {
      expectInRange(q.answer, range)
      expectInRange(q.operandB, [2, 9])
    }
  })
})

describe('formatQuestion', () => {
  it('joins the operands with the operator symbol', () => {
    expect(
      formatQuestion({ id: 'x', operandA: 12, operandB: 3, operation: 'division', answer: 4 }),
    ).toBe('12 ÷ 3')
  })
})
