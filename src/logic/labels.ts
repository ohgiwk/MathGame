import type { Difficulty, Operation, ActualOperation, QuestionCount, Rating } from '../types/game'

export const QUESTION_COUNTS: QuestionCount[] = [5, 10, 15]
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
export const OPERATIONS: Operation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'mixed',
]

export const ACTUAL_OPERATIONS: ActualOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
/** A mix needs at least this many operations to be a mix */
export const MIN_MIXED_OPERATIONS = 2

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '易しい',
  normal: '普通',
  hard: '難しい',
}

export const OPERATION_LABELS: Record<Operation, string> = {
  addition: '足し算',
  subtraction: '引き算',
  multiplication: '掛け算',
  division: '割り算',
  mixed: 'ミックス',
}

export const RATING_LABELS: Record<Rating, string> = {
  excellent: 'EXCELLENT!',
  great: 'GREAT!',
  good: 'GOOD!',
  nice: 'NICE!',
}

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: '1桁',
  normal: '2桁',
  hard: '3桁',
}

export const OPERATOR_SYMBOLS: Record<ActualOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

/** The operations a mixed game draws from, in display order; all four unless a valid choice is given. */
export function resolveMixedOperations(selected?: readonly ActualOperation[]): ActualOperation[] {
  const ops = ACTUAL_OPERATIONS.filter((op) => selected?.includes(op))
  return ops.length >= MIN_MIXED_OPERATIONS ? ops : [...ACTUAL_OPERATIONS]
}

/** Operation name for display; a partial mix also lists its operators, e.g. "ミックス（+−）". */
export function operationLabel(operation: Operation, mixedOperations?: ActualOperation[]): string {
  const label = OPERATION_LABELS[operation]
  if (operation !== 'mixed') return label
  const ops = resolveMixedOperations(mixedOperations)
  if (ops.length === ACTUAL_OPERATIONS.length) return label
  return `${label}（${ops.map((op) => OPERATOR_SYMBOLS[op]).join('')}）`
}
