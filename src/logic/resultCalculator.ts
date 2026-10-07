import type { GameState, GameResult, GameEndReason, GameOutcome } from '../types/game'
import { calculateScore } from './scoreCalculator'

/** `now` is the timestamp (ms) at which the game ended. */
export function calculateResult(
  state: GameState,
  endReason: GameEndReason,
  now: number,
): Omit<GameResult, 'isBestScore'> {
  const outcome: GameOutcome = {
    ...state.settings,
    endReason,
    correctCount: state.correctCount,
    totalAnswered: state.currentIndex + 1,
    elapsedSeconds: Math.round((now - state.startedAt) / 1000),
  }

  return {
    outcome,
    accuracy: Math.round((outcome.correctCount / outcome.totalAnswered) * 100),
    score: calculateScore(outcome),
  }
}
