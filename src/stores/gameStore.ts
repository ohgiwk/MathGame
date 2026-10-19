import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  Screen,
  GameSettings,
  GameState,
  GameResult,
  GameEndReason,
  Course,
} from '../types/game'
import { MAX_LIVES, FEEDBACK_DURATION_MS, TIME_LIMIT_SECONDS } from '../logic/constants'
import { ACTUAL_OPERATIONS } from '../logic/labels'
import { generateQuestions } from '../logic/questionGenerator'
import { checkAnswer } from '../logic/answerChecker'
import { calculateResult } from '../logic/resultCalculator'
import { questionPoints } from '../logic/scoreCalculator'
import { useStatsStore } from './statsStore'
import { useCourseStore } from './courseStore'
import { usePreferencesStore } from './preferencesStore'

export const useGameStore = defineStore('game', () => {
  const statsStore = useStatsStore()
  const courseStore = useCourseStore()
  const preferences = usePreferencesStore()

  const screen = ref<Screen>('setup')

  const settings = ref<GameSettings>({
    questionCount: 10,
    difficulty: 'normal',
    operation: 'addition',
    mixedOperations: [...ACTUAL_OPERATIONS],
  })

  const gameState = ref<GameState | null>(null)
  const result = ref<GameResult | null>(null)
  /** the daily course being played, kept for a retry; null for a game set up on the home screen */
  const courseId = ref<string | null>(null)
  /**
   * whether home shows the daily course list; it stays open while a course is played, so the
   * player comes back to it
   */
  // opened on launch while today's courses are still to clear, with a greeting for the day
  courseStore.refreshDay()
  const opensWithCourses = courseStore.courses.length > 0 && !courseStore.allClearedToday
  const courseDialogOpen = ref(opensWithCourses)
  /** whether the course list greets the player; only on launch, until they pick or close */
  const courseGreeting = ref(opensWithCourses)

  let feedbackTimer: ReturnType<typeof setTimeout> | null = null
  let limitTimer: ReturnType<typeof setTimeout> | null = null
  /** keys of every question asked in the current game, so endless batches avoid repeats */
  let usedKeys = new Set<string>()

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

  function clearLimitTimer() {
    if (limitTimer !== null) {
      clearTimeout(limitTimer)
      limitTimer = null
    }
  }

  function clearTimers() {
    clearFeedbackTimer()
    clearLimitTimer()
  }

  /** Runs the current question's countdown for `ms`; does nothing in a game without a time limit. */
  function startCountdown(state: GameState, ms: number | null) {
    clearLimitTimer()
    if (ms === null) return
    state.deadline = Date.now() + ms
    state.pausedRemainingMs = null
    limitTimer = setTimeout(() => {
      limitTimer = null
      resolveAnswer(false, true)
    }, ms)
  }

  /**
   * Starts a game with the given settings, or with the previous ones (and course) when omitted
   * (retry). `course` is the daily course the settings come from, if any.
   */
  function startGame(newSettings?: GameSettings, course: string | null = null) {
    if (newSettings) {
      settings.value = newSettings
      courseId.value = course
      courseDialogOpen.value = course !== null
    }
    courseGreeting.value = false

    clearTimers()

    const s = settings.value
    usedKeys = new Set()
    const questions = generateQuestions(s, undefined, usedKeys)
    const timeLimitMs = s.timeLimit ? TIME_LIMIT_SECONDS[s.timeLimit][s.difficulty] * 1000 : null

    gameState.value = {
      settings: { ...s },
      questions,
      currentIndex: 0,
      lives: MAX_LIVES,
      correctCount: 0,
      startedAt: Date.now(),
      feedback: null,
      timeLimitMs,
      deadline: null,
      pausedRemainingMs: null,
      questionStartedAt: Date.now(),
      pausedAt: null,
      points: 0,
    }
    startCountdown(gameState.value, timeLimitMs)

    result.value = null
    screen.value = 'game'
  }

  /** Starts a daily course, with the time limit chosen in the settings */
  function startCourse(course: Course) {
    startGame(
      {
        questionCount: course.questionCount,
        difficulty: course.difficulty,
        operation: course.operation,
        mixedOperations: course.mixedOperations,
        timeLimit: preferences.activeTimeLimit,
      },
      course.id,
    )
  }

  function submitAnswer(input: string) {
    const q = currentQuestion.value
    if (!q) return
    resolveAnswer(checkAnswer(q, input), false)
  }

  /** Settles the current question: by an answer, or as a miss when its time ran out. */
  function resolveAnswer(correct: boolean, timedOut: boolean) {
    const state = gameState.value
    if (!state || state.feedback) return
    const q = currentQuestion.value
    if (!q) return

    clearLimitTimer()
    state.deadline = null
    state.pausedRemainingMs = null
    // the time taken is only needed for this answer's points, so it is not kept
    const seconds = (Date.now() - state.questionStartedAt) / 1000
    const points = correct ? questionPoints(state.settings, q.operation, seconds) : 0
    state.points += points

    if (correct) {
      state.correctCount++
    } else {
      state.lives--
    }
    state.feedback = timedOut
      ? { correct, correctAnswer: q.answer, timedOut }
      : { correct, correctAnswer: q.answer }

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
    // an endless game tops up its questions before reaching the last one
    if (
      state.settings.questionCount === 'endless' &&
      state.currentIndex + 1 >= state.questions.length
    ) {
      state.questions.push(...generateQuestions(state.settings, undefined, usedKeys))
    }
    state.questionStartedAt = Date.now()
    startCountdown(state, state.timeLimitMs)
  }

  /**
   * Stops timing the current question, and its countdown, e.g. while the quit dialog is open.
   * Nothing is timed while feedback is shown, so a pause then changes nothing.
   */
  function pauseQuestion() {
    const state = gameState.value
    if (!state || state.feedback || state.pausedAt !== null) return
    state.pausedAt = Date.now()
    if (state.deadline === null) return
    clearLimitTimer()
    state.pausedRemainingMs = Math.max(state.deadline - Date.now(), 0)
    state.deadline = null
  }

  function resumeQuestion() {
    const state = gameState.value
    if (!state || state.pausedAt === null) return
    state.questionStartedAt += Date.now() - state.pausedAt
    state.pausedAt = null
    if (state.pausedRemainingMs !== null) startCountdown(state, state.pausedRemainingMs)
  }

  function finishGame(state: GameState, endReason: GameEndReason) {
    const r = calculateResult(state, endReason, Date.now())
    const previousBest = statsStore.bestScore(
      r.outcome.difficulty,
      r.outcome.operation,
      r.outcome.questionCount === 'endless',
    )
    result.value = { ...r, isBestScore: r.score.score > previousBest }
    statsStore.addRecord({ ...r.outcome, score: r.score.score })
    if (endReason === 'clear' && courseId.value !== null) courseStore.markCleared(courseId.value)
    gameState.value = null
    screen.value = 'result'
  }

  /** Back to the setup screen from anywhere, dropping any game in progress. */
  function goHome() {
    clearTimers()
    gameState.value = null
    result.value = null
    courseId.value = null
    screen.value = 'setup'
  }

  function openStats() {
    screen.value = 'stats'
  }

  function openSettings() {
    screen.value = 'settings'
  }

  return {
    screen,
    settings,
    gameState,
    result,
    courseId,
    courseDialogOpen,
    courseGreeting,
    currentQuestion,
    startGame,
    startCourse,
    submitAnswer,
    pauseQuestion,
    resumeQuestion,
    goHome,
    openStats,
    openSettings,
  }
})
