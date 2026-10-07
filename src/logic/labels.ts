import type { Difficulty, Operation, ActualOperation, QuestionCount } from '../types/game'

export const QUESTION_COUNTS: QuestionCount[] = [5, 10, 15]
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
export const OPERATIONS: Operation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'mixed',
]

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
