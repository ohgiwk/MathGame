import type {
  Difficulty,
  ActualOperation,
  Operation,
  GameOutcome,
  GameSettings,
  Rating,
  ScoreBreakdown,
} from '../types/game'
import { FEEDBACK_DURATION_MS } from './constants'
import { resolveMixedOperations } from './labels'

const BASE_POINTS_PER_CORRECT = 100

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  normal: 1.5,
  hard: 2.5,
}

const OPERATION_MULTIPLIER: Record<ActualOperation, number> = {
  addition: 1,
  subtraction: 1.1,
  multiplication: 1.3,
  division: 1.4,
}
/** Switching between operations is harder than any one of them; added per extra operation in a mix */
const MIX_BONUS_PER_OPERATION = 0.1

/**
 * What one operation is worth in this game: in a mix, each question is worth its own operation
 * plus the switching bonus for the mix.
 */
function operationMultiplier(
  operation: ActualOperation,
  gameOperation: Operation,
  mixedOperations?: ActualOperation[],
): number {
  if (gameOperation !== 'mixed') return OPERATION_MULTIPLIER[operation]
  const ops = resolveMixedOperations(mixedOperations)
  return OPERATION_MULTIPLIER[operation] + MIX_BONUS_PER_OPERATION * (ops.length - 1)
}

/** The average worth of the operations a game draws from */
function averageOperationMultiplier(outcome: GameOutcome): number {
  if (outcome.operation !== 'mixed') return OPERATION_MULTIPLIER[outcome.operation]
  const ops = resolveMixedOperations(outcome.mixedOperations)
  return (
    ops.reduce((sum, op) => sum + operationMultiplier(op, 'mixed', outcome.mixedOperations), 0) /
    ops.length
  )
}

/** Thinking time per question (seconds) that earns PAR_SPEED_MULTIPLIER */
const PAR_SECONDS: Record<Difficulty, number> = {
  easy: 3,
  normal: 6,
  hard: 12,
}
const PAR_SPEED_MULTIPLIER = 1.5
/** The speed bonus fades to nothing at this many times the par time */
const SLOW_PAR_FACTOR = 3

/** Same for every question count, so the score stays in proportion to the questions answered */
const CLEAR_MULTIPLIER = 1.1
const PERFECT_MULTIPLIER = 1.1

/**
 * Grows in a straight line as thinking time drops: 1 at the slow limit and beyond,
 * PAR_SPEED_MULTIPLIER at par, and on past par with no cap (1.75 at zero).
 */
function speedMultiplier(thinkingSeconds: number, difficulty: Difficulty): number {
  const par = PAR_SECONDS[difficulty]
  const slow = par * SLOW_PAR_FACTOR
  const ratio = Math.max((slow - Math.max(thinkingSeconds, 0)) / (slow - par), 0)
  return 1 + (PAR_SPEED_MULTIPLIER - 1) * ratio
}

/** The game a question belongs to, as far as its points are concerned */
type PointsContext = Pick<GameSettings, 'difficulty' | 'operation' | 'mixedOperations'>

/**
 * Points for one correct answer: 100 × difficulty × its operation × how fast it was answered.
 * A wrong answer or a timeout earns nothing.
 */
export function questionPoints(
  game: PointsContext,
  operation: ActualOperation,
  thinkingSeconds: number,
): number {
  return Math.round(
    BASE_POINTS_PER_CORRECT *
      DIFFICULTY_MULTIPLIER[game.difficulty] *
      operationMultiplier(operation, game.operation, game.mixedOperations) *
      speedMultiplier(thinkingSeconds, game.difficulty),
  )
}

/**
 * The game's score: the points of every answer added up, then the clear and no-miss bonuses.
 * An endless game only ends when the lives run out, so it never gets them.
 */
export function calculateScore(outcome: GameOutcome, points: number): ScoreBreakdown {
  const cleared = outcome.endReason === 'clear' && outcome.questionCount !== 'endless'
  const perfect = cleared && outcome.correctCount === outcome.totalAnswered
  const clearMultiplier = (cleared ? CLEAR_MULTIPLIER : 1) * (perfect ? PERFECT_MULTIPLIER : 1)
  return { points, clearMultiplier, score: Math.round(points * clearMultiplier) }
}

/**
 * Close to what a game would have scored, for when its answers are not known one by one: every
 * correct answer is taken at the game's average time and its average operation.
 */
export function estimateScore(outcome: GameOutcome): number {
  const thinking =
    outcome.totalAnswered > 0
      ? outcome.elapsedSeconds / outcome.totalAnswered - FEEDBACK_DURATION_MS / 1000
      : 0
  const perAnswer =
    BASE_POINTS_PER_CORRECT *
    DIFFICULTY_MULTIPLIER[outcome.difficulty] *
    averageOperationMultiplier(outcome) *
    speedMultiplier(thinking, outcome.difficulty)
  return calculateScore(outcome, Math.round(outcome.correctCount * perAnswer)).score
}

/** Lowest share of the model score that earns each rating; anything below is 'nice' */
const RATING_THRESHOLDS: [Rating, number][] = [
  ['excellent', 0.85],
  ['great', 0.6],
  ['good', 0.4],
]

/**
 * Rates a cleared game by its score relative to a model one for the same settings (every answer
 * correct at par speed), so every difficulty and operation is rated alike. Beating par scores
 * above the model, which still rates excellent.
 */
export function calculateRating(outcome: GameOutcome, score: number): Rating | null {
  if (outcome.endReason !== 'clear' || outcome.questionCount === 'endless') return null
  const n = outcome.questionCount
  const model = estimateScore({
    ...outcome,
    correctCount: n,
    totalAnswered: n,
    elapsedSeconds: n * (PAR_SECONDS[outcome.difficulty] + FEEDBACK_DURATION_MS / 1000),
  })
  const share = score / model
  return RATING_THRESHOLDS.find(([, min]) => share >= min)?.[0] ?? 'nice'
}
