import type {
  Difficulty,
  Operation,
  ActualOperation,
  QuestionCount,
  RecordedQuestionCount,
  Rating,
  TimeLimitLength,
  ThemePreference,
} from '../types/game'

export const QUESTION_COUNTS: QuestionCount[] = [10, 20, 30, 50, 'endless']
/** Every length found in saved records, including ones that can no longer be chosen */
export const RECORDED_QUESTION_COUNTS: RecordedQuestionCount[] = [5, 15, ...QUESTION_COUNTS]
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

export function questionCountLabel(count: RecordedQuestionCount): string {
  return count === 'endless' ? 'エンドレス' : `${count}問`
}

export const TIME_LIMIT_LENGTHS: TimeLimitLength[] = ['short', 'normal', 'long']

export const TIME_LIMIT_LABELS: Record<TimeLimitLength, string> = {
  short: '短め',
  normal: '普通',
  long: '長め',
}

export const THEME_PREFERENCES: ThemePreference[] = ['auto', 'light', 'dark']

export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: '自動',
  light: 'ライト',
  dark: 'ダーク',
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

/** A game's kind for display, e.g. "普通 · 足し算 · 10問" */
export function kindLabel(game: {
  difficulty: Difficulty
  operation: Operation
  mixedOperations?: ActualOperation[]
  questionCount: RecordedQuestionCount
}): string {
  return [
    DIFFICULTY_LABELS[game.difficulty],
    operationLabel(game.operation, game.mixedOperations),
    questionCountLabel(game.questionCount),
  ].join(' · ')
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
