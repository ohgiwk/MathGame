import type {
  Difficulty,
  Operation,
  QuestionCount,
  GameOutcome,
  ScoreBreakdown,
} from '../types/game'
import { FEEDBACK_DURATION_MS } from './constants'

const BASE_POINTS_PER_CORRECT = 100

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  normal: 1.5,
  hard: 2.5,
}

const OPERATION_MULTIPLIER: Record<Operation, number> = {
  addition: 1,
  subtraction: 1.1,
  multiplication: 1.3,
  division: 1.4,
  mixed: 1.5,
}

/** Thinking time per question (seconds) that earns the full speed bonus */
const PAR_SECONDS: Record<Difficulty, number> = {
  easy: 3,
  normal: 6,
  hard: 12,
}
const MAX_SPEED_MULTIPLIER = 1.5
/** The speed bonus fades to nothing at this many times the par time */
const SLOW_PAR_FACTOR = 3

const MISTAKE_PENALTY = 0.1

/** Longer runs are harder to finish on three lives, so clearing them is worth more */
const CLEAR_MULTIPLIER: Record<QuestionCount, number> = {
  5: 1.1,
  10: 1.2,
  15: 1.3,
}
const PERFECT_BONUS = 0.2

function speedMultiplier(input: GameOutcome): number {
  if (input.totalAnswered === 0) return 1
  // elapsed time includes the feedback shown after every answer
  const thinking = Math.max(
    input.elapsedSeconds / input.totalAnswered - FEEDBACK_DURATION_MS / 1000,
    0,
  )
  const par = PAR_SECONDS[input.difficulty]
  const slow = par * SLOW_PAR_FACTOR
  const ratio = Math.min(Math.max((slow - thinking) / (slow - par), 0), 1)
  return 1 + (MAX_SPEED_MULTIPLIER - 1) * ratio
}

export function calculateScore(input: GameOutcome): ScoreBreakdown {
  const mistakes = input.totalAnswered - input.correctCount
  const cleared = input.endReason === 'clear'

  const base =
    input.correctCount *
    BASE_POINTS_PER_CORRECT *
    DIFFICULTY_MULTIPLIER[input.difficulty] *
    OPERATION_MULTIPLIER[input.operation]
  const speed = speedMultiplier(input)
  const mistake = Math.max(1 - MISTAKE_PENALTY * mistakes, 0)
  const clear = cleared
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
