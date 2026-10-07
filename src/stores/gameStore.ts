import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Screen, GameSettings, GameState, GameResult, GameEndReason } from '../types/game'
import { MAX_LIVES, FEEDBACK_DURATION_MS } from '../types/game'
import { generateQuestions } from '../logic/questionGenerator'
import { checkAnswer } from '../logic/answerChecker'
import { calculateResult } from '../logic/resultCalculator'
import { useStatsStore } from './statsStore'

export const useGameStore = defineStore('game', () => {
  const statsStore = useStatsStore()

  const screen = ref<Screen>('setup')

  const settings = ref<GameSettings>({
    questionCount: 10,
    difficulty: 'normal',
    operation: 'addition',
  })

  const gameState = ref<GameState | null>(null)
  const result = ref<GameResult | null>(null)

  let feedbackTimer: ReturnType<typeof setTimeout> | null = null

  const currentQuestion = computed(() => {
    const s = gameState.value
    if (!s) return null
    return s.questions[s.currentIndex] ?? null
  })

  function clearFeedbackTimer() {
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer)
      feedbackTimer = null
    }
  }

  /** Starts a game with the given settings, or with the previous ones when omitted (retry). */
  function startGame(newSettings?: GameSettings) {
    if (newSettings) settings.value = newSettings

    clearFeedbackTimer()

    const s = settings.value
    const questions = generateQuestions(s)

    gameState.value = {
      settings: { ...s },
      questions,
      currentIndex: 0,
      lives: MAX_LIVES,
      correctCount: 0,
      startedAt: Date.now(),
      feedback: null,
    }

    result.value = null
    screen.value = 'game'
  }

  function submitAnswer(input: string) {
    const state = gameState.value
    if (!state || state.feedback) return
    const q = currentQuestion.value
    if (!q) return

    const correct = checkAnswer(q, input)
    if (correct) {
      state.correctCount++
    } else {
      state.lives--
    }
    state.feedback = { correct, correctAnswer: q.answer }

    feedbackTimer = setTimeout(() => {
      feedbackTimer = null
      const s = gameState.value
      if (!s) return

      if (s.lives <= 0) finishGame(s, 'gameover')
      else if (s.currentIndex + 1 >= s.questions.length) finishGame(s, 'clear')
      else advanceQuestion(s)
    }, FEEDBACK_DURATION_MS)
  }

  function advanceQuestion(state: GameState) {
    state.currentIndex++
    state.feedback = null
  }

  function finishGame(state: GameState, endReason: GameEndReason) {
    const r = calculateResult(state, endReason, Date.now())
    const { difficulty, operation, questionCount } = state.settings
    const previousBest = statsStore.bestScore(difficulty, operation)
    result.value = { ...r, isBestScore: r.score.score > previousBest }
    statsStore.addRecord({
      difficulty,
      operation,
      questionCount,
      endReason,
      correctCount: r.correctCount,
      totalAnswered: r.totalAnswered,
      elapsedSeconds: r.elapsedSeconds,
      score: r.score.score,
    })
    gameState.value = null
    screen.value = 'result'
  }

  /** Back to the setup screen from anywhere, dropping any game in progress. */
  function goHome() {
    clearFeedbackTimer()
    gameState.value = null
    result.value = null
    screen.value = 'setup'
  }

  function openStats() {
    screen.value = 'stats'
  }

  return {
    screen,
    settings,
    gameState,
    result,
    currentQuestion,
    startGame,
    submitAnswer,
    goHome,
    openStats,
  }
})
