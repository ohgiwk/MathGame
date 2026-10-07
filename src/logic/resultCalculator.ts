import type { GameState, GameResult, GameEndReason } from '../types/game'

export function calculateResult(state: GameState, endReason: GameEndReason): GameResult {
  const totalAnswered = state.currentIndex + 1
  const elapsedSeconds = Math.round((Date.now() - state.startedAt) / 1000)
  const accuracy = totalAnswered > 0
    ? Math.round((state.correctCount / totalAnswered) * 100)
    : 0

  return {
    endReason,
    correctCount: state.correctCount,
    totalAnswered,
    totalCount: state.settings.questionCount,
    accuracy,
    elapsedSeconds,
  }
}

export function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}
