import type {
  Difficulty,
  ActualOperation,
  FixedQuestionCount,
  GameOutcome,
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

/** A mix is worth the average of its operations plus the switching bonus (1.5 for all four). */
function operationMultiplier(input: GameOutcome): number {
  if (input.operation !== 'mixed') return OPERATION_MULTIPLIER[input.operation]
  const ops = resolveMixedOperations(input.mixedOperations)
  const average = ops.reduce((sum, op) => sum + OPERATION_MULTIPLIER[op], 0) / ops.length
  return average + MIX_BONUS_PER_OPERATION * (ops.length - 1)
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

const MISTAKE_PENALTY = 0.1

/** Longer runs are harder to finish on three lives, so clearing them is worth more */
const CLEAR_MULTIPLIER: Record<FixedQuestionCount, number> = {
  5: 1.1,
  10: 1.2,
  15: 1.3,
}
const PERFECT_BONUS = 0.2

/**
 * The speed bonus earned by one answer, as a share of the bonus at par: 0 at the slow limit and
 * beyond, 1 at par, and on past par with no cap (1.5 at zero), so every bit of speed still counts.
 */
function speedRatio(thinkingSeconds: number, difficulty: Difficulty): number {
  const par = PAR_SECONDS[difficulty]
  const slow = par * SLOW_PAR_FACTOR
  return Math.max((slow - Math.max(thinkingSeconds, 0)) / (slow - par), 0)
}

/**
 * Each answer earns its own speed bonus and the game gets their average, so one slow question
 * costs only its own bonus. Records saved before answers were timed one by one fall back to the
 * average time per answer, less the feedback shown after each one.
 */
function speedMultiplier(input: GameOutcome): number {
  if (input.totalAnswered === 0) return 1
  const times = input.answerSeconds ?? [
    input.elapsedSeconds / input.totalAnswered - FEEDBACK_DURATION_MS / 1000,
  ]
  if (times.length === 0) return 1
  const ratio = times.reduce((sum, t) => sum + speedRatio(t, input.difficulty), 0) / times.length
  return 1 + (PAR_SPEED_MULTIPLIER - 1) * ratio
}

export function calculateScore(input: GameOutcome): ScoreBreakdown {
  const mistakes = input.totalAnswered - input.correctCount
  const cleared = input.endReason === 'clear'

  const base =
    input.correctCount *
    BASE_POINTS_PER_CORRECT *
    DIFFICULTY_MULTIPLIER[input.difficulty] *
    operationMultiplier(input)
  const speed = speedMultiplier(input)
  const mistake = Math.max(1 - MISTAKE_PENALTY * mistakes, 0)
  // an endless game only ends when the lives run out, so it never gets the clear bonus
  const clear =
    cleared && input.questionCount !== 'endless'
      ? CLEAR_MULTIPLIER[input.questionCount] + (mistakes === 0 ? PERFECT_BONUS : 0)
      : 1

  return {
    base: Math.round(base),
    speedMultiplier: speed,
    mistakeMultiplier: mistake,
    clearMultiplier: clear,
    score: Math.round(base * speed * mistake * clear),
  }
}

/** Lowest share of the best possible score that earns each rating; anything below is 'nice' */
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
  const best = calculateScore({
    ...outcome,
    correctCount: outcome.questionCount,
    totalAnswered: outcome.questionCount,
    answerSeconds: Array<number>(outcome.questionCount).fill(PAR_SECONDS[outcome.difficulty]),
  }).score
  const share = score / best
  return RATING_THRESHOLDS.find(([, min]) => share >= min)?.[0] ?? 'nice'
}
