import type { GameState, GameResult, GameEndReason, GameOutcome } from '../types/game'
import { calculateScore, calculateRating } from './scoreCalculator'

/** `now` is the timestamp (ms) at which the game ended. */
export function calculateResult(
  state: GameState,
  endReason: GameEndReason,
  now: number,
): Omit<GameResult, 'isBestScore'> {
  // the time limit only changes how the game is played, so it is not part of the record
  const { difficulty, operation, mixedOperations, questionCount } = state.settings
  const outcome: GameOutcome = {
    difficulty,
    operation,
    ...(operation === 'mixed' && mixedOperations ? { mixedOperations } : {}),
    questionCount,
    endReason,
    correctCount: state.correctCount,
    totalAnswered: state.currentIndex + 1,
    elapsedSeconds: (now - state.startedAt) / 1000,
    answerSeconds: [...state.answerSeconds],
  }

  const score = calculateScore(outcome)
  return {
    outcome,
    accuracy: Math.round((outcome.correctCount / outcome.totalAnswered) * 100),
    score,
    rating: calculateRating(outcome, score.score),
  }
}
