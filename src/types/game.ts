import type { ScoreBreakdown } from '../logic/scoreCalculator'

export type Difficulty = 'easy' | 'normal' | 'hard'
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
export type ActualOperation = Exclude<Operation, 'mixed'>
export type Screen = 'setup' | 'game' | 'result' | 'stats'
export type GameEndReason = 'clear' | 'gameover'
export type QuestionCount = 5 | 10 | 15

export interface GameSettings {
  questionCount: QuestionCount
  difficulty: Difficulty
  operation: Operation
}

export interface Question {
  id: string
  operandA: number
  operandB: number
  operation: ActualOperation
  answer: number
}

export interface FeedbackState {
  correct: boolean
  correctAnswer: number
}

export interface GameState {
  settings: GameSettings
  questions: Question[]
  currentIndex: number
  lives: number
  correctCount: number
  startedAt: number
  isSubmitting: boolean
  feedback: FeedbackState | null
}

export interface GameResult {
  endReason: GameEndReason
  correctCount: number
  totalAnswered: number
  totalCount: number
  accuracy: number
  elapsedSeconds: number
  score: ScoreBreakdown
  /** true when this beats every earlier score for the same difficulty and operation */
  isBestScore: boolean
}

export interface GameRecord {
  id: string
  playedAt: number
  difficulty: Difficulty
  operation: Operation
  questionCount: QuestionCount
  endReason: GameEndReason
  correctCount: number
  totalAnswered: number
  elapsedSeconds: number
  score: number
}

export const MAX_LIVES = 3
export const FEEDBACK_DURATION_MS = 900
