export type Difficulty = 'easy' | 'normal' | 'hard'
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
export type ActualOperation = Exclude<Operation, 'mixed'>
export type Screen = 'setup' | 'game' | 'result' | 'stats'
export type GameEndReason = 'clear' | 'gameover'
export type QuestionCount = 5 | 10 | 15
/** How good a cleared game's score is, best first */
export type Rating = 'excellent' | 'great' | 'good' | 'nice'

export interface GameSettings {
  questionCount: QuestionCount
  difficulty: Difficulty
  operation: Operation
  /** operations drawn from when `operation` is 'mixed'; all four when omitted */
  mixedOperations?: ActualOperation[]
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
  /** set while the result of the last answer is shown; no input is accepted meanwhile */
  feedback: FeedbackState | null
}

/** What happened in one finished game; everything the score is computed from. */
export interface GameOutcome {
  difficulty: Difficulty
  operation: Operation
  /** only set for 'mixed' games; all four when omitted */
  mixedOperations?: ActualOperation[]
  questionCount: QuestionCount
  endReason: GameEndReason
  correctCount: number
  totalAnswered: number
  elapsedSeconds: number
}

export interface ScoreBreakdown {
  /** correct answers × 100 × difficulty × operation */
  base: number
  speedMultiplier: number
  mistakeMultiplier: number
  clearMultiplier: number
  score: number
}

export interface GameResult {
  outcome: GameOutcome
  /** 0-100 */
  accuracy: number
  score: ScoreBreakdown
  /** null on a game over */
  rating: Rating | null
  /** true when this beats every earlier score for the same difficulty and operation */
  isBestScore: boolean
}

export interface GameRecord extends GameOutcome {
  id: string
  playedAt: number
  score: number
}
