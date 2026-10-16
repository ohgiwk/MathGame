export type Difficulty = 'easy' | 'normal' | 'hard'
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
export type ActualOperation = Exclude<Operation, 'mixed'>
export type Screen = 'setup' | 'game' | 'result' | 'stats' | 'settings'
export type GameEndReason = 'clear' | 'gameover'
/** How long each question may take when the time limit is on */
export type TimeLimitLength = 'short' | 'normal' | 'long'
/** 'endless' keeps asking until the lives run out */
export type QuestionCount = 5 | 10 | 15 | 'endless'
export type FixedQuestionCount = Exclude<QuestionCount, 'endless'>
/** How good a cleared game's score is, best first */
export type Rating = 'excellent' | 'great' | 'good' | 'nice'

export interface GameSettings {
  questionCount: QuestionCount
  difficulty: Difficulty
  operation: Operation
  /** operations drawn from when `operation` is 'mixed'; all four when omitted */
  mixedOperations?: ActualOperation[]
  /** each question must be answered within this length's limit for the difficulty; none when omitted */
  timeLimit?: TimeLimitLength
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
  /** the question was not answered in time */
  timedOut?: boolean
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
  /** ms allowed per question; null when the game has no time limit */
  timeLimitMs: number | null
  /** when the current question times out; null while no countdown is running */
  deadline: number | null
  /** time left on the current question while the countdown is paused */
  pausedRemainingMs: number | null
  /** when the current question started being timed, moved forward by any time spent paused */
  questionStartedAt: number
  /** set while the game is paused (quit dialog open) */
  pausedAt: number | null
  /** seconds taken on each answered question, in order */
  answerSeconds: number[]
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
  /** to the millisecond, so small differences still count in the score */
  elapsedSeconds: number
  /**
   * seconds taken on each answered question, not counting feedback or pauses; the speed bonus is
   * worked out from these. Absent on records saved before answers were timed one by one.
   */
  answerSeconds?: number[]
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
