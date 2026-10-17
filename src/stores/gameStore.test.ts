import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { FEEDBACK_DURATION_MS, MAX_LIVES, TIME_LIMIT_SECONDS } from '../logic/constants'
import { useGameStore } from './gameStore'
import { useStatsStore } from './statsStore'

const settings = { questionCount: 10, difficulty: 'easy', operation: 'addition' } as const

function answer(store: ReturnType<typeof useGameStore>, correct: boolean) {
  const q = store.currentQuestion!
  store.submitAnswer(String(correct ? q.answer : q.answer + 1))
}

describe('gameStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts a game on the game screen with full lives', () => {
    const store = useGameStore()
    store.startGame(settings)
    expect(store.screen).toBe('game')
    expect(store.gameState).toMatchObject({ currentIndex: 0, lives: MAX_LIVES, feedback: null })
    expect(store.gameState!.questions).toHaveLength(10)
  })

  it('shows feedback, ignores input meanwhile, then moves to the next question', () => {
    const store = useGameStore()
    store.startGame(settings)
    const first = store.currentQuestion!

    answer(store, true)
    expect(store.gameState!.feedback).toEqual({ correct: true, correctAnswer: first.answer })

    answer(store, false)
    expect(store.gameState).toMatchObject({ correctCount: 1, lives: MAX_LIVES })

    vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
    expect(store.gameState).toMatchObject({ currentIndex: 1, feedback: null })
  })

  it('ends with a clear after the last question and saves the record', () => {
    const store = useGameStore()
    const stats = useStatsStore()
    const before = stats.records.length
    store.startGame(settings)
    for (let i = 0; i < 10; i++) {
      answer(store, true)
      vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
    }
    expect(store.screen).toBe('result')
    expect(store.gameState).toBeNull()
    expect(store.result!.outcome).toMatchObject({
      endReason: 'clear',
      correctCount: 10,
      totalAnswered: 10,
    })
    expect(stats.records).toHaveLength(before + 1)
    expect(stats.records[0]).toMatchObject({ ...settings, endReason: 'clear', correctCount: 10 })
  })

  it('ends with a game over when the lives run out', () => {
    const store = useGameStore()
    store.startGame(settings)
    for (let i = 0; i < MAX_LIVES; i++) {
      answer(store, false)
      vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
    }
    expect(store.screen).toBe('result')
    expect(store.result!.outcome).toMatchObject({
      endReason: 'gameover',
      correctCount: 0,
      totalAnswered: MAX_LIVES,
    })
  })

  it('flags a best score only when it beats the earlier ones', () => {
    const store = useGameStore()
    const play = (correctAnswers: number) => {
      store.startGame(settings)
      for (let i = 0; i < 10 && store.gameState; i++) {
        answer(store, i < correctAnswers)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      return store.result!
    }
    expect(play(9).isBestScore).toBe(true)
    expect(play(8).isBestScore).toBe(false)
    expect(play(10).isBestScore).toBe(true)
  })

  it('retries with the previous settings when startGame gets none', () => {
    const store = useGameStore()
    store.startGame({ questionCount: 30, difficulty: 'hard', operation: 'division' })
    store.goHome()
    store.startGame()
    expect(store.gameState!.settings).toEqual({
      questionCount: 30,
      difficulty: 'hard',
      operation: 'division',
    })
  })

  it('goHome drops the game and a pending feedback timer', () => {
    const store = useGameStore()
    store.startGame(settings)
    answer(store, true)
    store.goHome()
    expect(store.screen).toBe('setup')
    expect(store.gameState).toBeNull()

    // a new game started before the old timer would have fired must not be advanced by it
    store.startGame(settings)
    vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
    expect(store.gameState).toMatchObject({ currentIndex: 0, feedback: null })
  })

  describe('endless', () => {
    const endless = { ...settings, questionCount: 'endless' } as const

    it('keeps adding questions until the lives run out, never clearing', () => {
      const store = useGameStore()
      store.startGame(endless)
      for (let i = 0; i < 60; i++) {
        answer(store, true)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      expect(store.screen).toBe('game')
      expect(store.gameState!.currentIndex).toBe(60)
      expect(store.gameState!.questions.length).toBeGreaterThan(61)

      for (let i = 0; i < MAX_LIVES; i++) {
        answer(store, false)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      expect(store.screen).toBe('result')
      expect(store.result!.outcome).toMatchObject({
        questionCount: 'endless',
        endReason: 'gameover',
        correctCount: 60,
        totalAnswered: 63,
      })
      expect(store.result!.rating).toBeNull()
    })

    it('never asks the same question twice in a row', () => {
      const store = useGameStore()
      store.startGame(endless)
      // easy addition has only 45 distinct questions, so the pool has to start over
      for (let i = 0; i < 100; i++) {
        answer(store, true)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      const ids = store.gameState!.questions.map((q) => q.id)
      expect(ids.every((id, i) => i === 0 || id !== ids[i - 1])).toBe(true)
    })

    it('compares best scores with endless games only', () => {
      const store = useGameStore()
      const stats = useStatsStore()
      stats.addRecord({
        ...settings,
        endReason: 'clear',
        correctCount: 5,
        totalAnswered: 5,
        elapsedSeconds: 1,
        score: 1_000_000,
      })
      store.startGame(endless)
      answer(store, true)
      vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      for (let i = 0; i < MAX_LIVES; i++) {
        answer(store, false)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      expect(store.result!.isBestScore).toBe(true)
    })
  })

  describe('time limit', () => {
    const limited = { ...settings, timeLimit: 'normal' } as const
    const limitMs = TIME_LIMIT_SECONDS.normal.easy * 1000

    it('runs no countdown when the time limit is off', () => {
      const store = useGameStore()
      store.startGame(settings)
      expect(store.gameState).toMatchObject({ timeLimitMs: null, deadline: null })
      vi.advanceTimersByTime(limitMs * 2)
      expect(store.gameState).toMatchObject({ lives: MAX_LIVES, feedback: null })
    })

    it('uses the chosen length for the difficulty', () => {
      const store = useGameStore()
      store.startGame({ ...settings, difficulty: 'hard', timeLimit: 'short' })
      expect(store.gameState!.timeLimitMs).toBe(TIME_LIMIT_SECONDS.short.hard * 1000)
      store.startGame({ ...settings, difficulty: 'hard', timeLimit: 'long' })
      expect(store.gameState!.timeLimitMs).toBe(TIME_LIMIT_SECONDS.long.hard * 1000)
    })

    it('counts a question that runs out of time as a miss', () => {
      const store = useGameStore()
      store.startGame(limited)
      const q = store.currentQuestion!
      vi.advanceTimersByTime(limitMs - 1)
      expect(store.gameState!.feedback).toBeNull()
      vi.advanceTimersByTime(1)
      expect(store.gameState).toMatchObject({
        lives: MAX_LIVES - 1,
        feedback: { correct: false, correctAnswer: q.answer, timedOut: true },
      })

      // the next question gets a fresh countdown
      vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      expect(store.gameState!.currentIndex).toBe(1)
      expect(store.gameState!.deadline).toBe(Date.now() + limitMs)
    })

    it('stops the countdown once the question is answered', () => {
      const store = useGameStore()
      store.startGame(limited)
      vi.advanceTimersByTime(limitMs - 100)
      answer(store, true)
      expect(store.gameState!.deadline).toBeNull()
      vi.advanceTimersByTime(100)
      expect(store.gameState).toMatchObject({ lives: MAX_LIVES, correctCount: 1 })
    })

    it('keeps the time left while paused', () => {
      const store = useGameStore()
      store.startGame(limited)
      vi.advanceTimersByTime(4000)
      store.pauseQuestion()
      expect(store.gameState!.pausedRemainingMs).toBe(limitMs - 4000)
      vi.advanceTimersByTime(limitMs * 2)
      expect(store.gameState!.feedback).toBeNull()

      store.resumeQuestion()
      vi.advanceTimersByTime(limitMs - 4000)
      expect(store.gameState!.feedback).toMatchObject({ timedOut: true })
    })

    it('does not save the time limit in the record', () => {
      const store = useGameStore()
      const stats = useStatsStore()
      store.startGame(limited)
      for (let i = 0; i < 10; i++) {
        answer(store, true)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      expect(stats.records[0]).not.toHaveProperty('timeLimit')
    })
  })

  describe('points', () => {
    it('gives each correct answer points by how fast it came, not counting feedback', () => {
      const store = useGameStore()
      store.startGame(settings)
      // easy addition at par (3s) earns 150
      vi.advanceTimersByTime(3000)
      answer(store, true)
      expect(store.gameState!.points).toBe(150)
      vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      // at the slow limit (9s) only the base 100 is left
      vi.advanceTimersByTime(9000)
      answer(store, true)
      expect(store.gameState!.points).toBe(250)
    })

    it('gives nothing for a wrong answer', () => {
      const store = useGameStore()
      store.startGame(settings)
      answer(store, false)
      expect(store.gameState!.points).toBe(0)
    })

    it('leaves time spent paused out of the answer', () => {
      const store = useGameStore()
      store.startGame(settings)
      vi.advanceTimersByTime(1000)
      store.pauseQuestion()
      vi.advanceTimersByTime(30_000)
      store.resumeQuestion()
      vi.advanceTimersByTime(2000)
      answer(store, true)
      expect(store.gameState!.points).toBe(150)
    })

    it('scores the total with the bonuses and keeps no answer details in the record', () => {
      const store = useGameStore()
      const stats = useStatsStore()
      store.startGame(settings)
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(9000)
        answer(store, true)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      // 10 × 100, then the clear and no-miss bonuses (× 1.1 × 1.1)
      expect(store.result!.score).toMatchObject({ points: 1000, score: 1210 })
      expect(stats.records[0].score).toBe(1210)
      expect(Object.keys(stats.records[0]).sort()).toEqual(
        [
          'correctCount',
          'difficulty',
          'elapsedSeconds',
          'endReason',
          'id',
          'operation',
          'playedAt',
          'questionCount',
          'score',
          'totalAnswered',
        ].sort(),
      )
    })
  })
})
