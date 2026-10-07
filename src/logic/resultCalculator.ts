import type { GameState, GameResult, GameEndReason } from '../types/game'
import { calculateScore } from './scoreCalculator'

/** `now` is the timestamp (ms) at which the game ended. */
export function calculateResult(
  state: GameState,
  endReason: GameEndReason,
  now: number,
): Omit<GameResult, 'isBestScore'> {
  const totalAnswered = state.currentIndex + 1
  const elapsedSeconds = Math.round((now - state.startedAt) / 1000)
  const accuracy = totalAnswered > 0 ? Math.round((state.correctCount / totalAnswered) * 100) : 0

  const score = calculateScore({
    difficulty: state.settings.difficulty,
    operation: state.settings.operation,
    questionCount: state.settings.questionCount,
    endReason,
    correctCount: state.correctCount,
    totalAnswered,
    elapsedSeconds,
  })

  return {
    endReason,
    correctCount: state.correctCount,
    totalAnswered,
    totalCount: state.settings.questionCount,
    accuracy,
    elapsedSeconds,
    score,
  }
}

export function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}
