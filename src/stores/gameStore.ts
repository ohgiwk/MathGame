import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Screen, GameSettings, GameState, GameResult } from '../types/game'
import { MAX_LIVES, FEEDBACK_DURATION_MS } from '../types/game'
import { generateQuestions } from '../logic/questionGenerator'
import { checkAnswer } from '../logic/answerChecker'
import { calculateResult } from '../logic/resultCalculator'

export const useGameStore = defineStore('game', () => {
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

  const progressRatio = computed(() => {
    const s = gameState.value
    if (!s || s.questions.length === 0) return 0
    return s.currentIndex / s.questions.length
  })

  function startGame(newSettings?: GameSettings) {
    if (newSettings) settings.value = newSettings

    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer)
      feedbackTimer = null
    }

    const s = settings.value
    const questions = generateQuestions(s)

    gameState.value = {
      settings: { ...s },
      questions,
      currentIndex: 0,
      lives: MAX_LIVES,
      correctCount: 0,
      startedAt: Date.now(),
      isSubmitting: false,
      feedback: null,
    }

    result.value = null
    screen.value = 'game'
  }

  function submitAnswer(input: string) {
    const state = gameState.value
    if (!state || state.isSubmitting) return
    const q = currentQuestion.value
    if (!q) return

    state.isSubmitting = true

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

      const isGameOver = s.lives <= 0
      const isLastQuestion = s.currentIndex + 1 >= s.questions.length

      if (isGameOver || isLastQuestion) {
        const endReason = isGameOver ? 'gameover' : 'clear'
        result.value = calculateResult(s, endReason)
        gameState.value = null
        screen.value = 'result'
        return
      }

      s.currentIndex++
      s.feedback = null
      s.isSubmitting = false
    }, FEEDBACK_DURATION_MS)
  }

  function resetGame() {
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer)
      feedbackTimer = null
    }
    gameState.value = null
    result.value = null
    screen.value = 'setup'
  }

  function retryGame() {
    startGame()
  }

  return {
    screen,
    settings,
    gameState,
    result,
    currentQuestion,
    progressRatio,
    startGame,
    submitAnswer,
    resetGame,
    retryGame,
  }
})
