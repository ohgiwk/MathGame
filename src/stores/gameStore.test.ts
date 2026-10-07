import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { FEEDBACK_DURATION_MS, MAX_LIVES } from '../logic/constants'
import { useGameStore } from './gameStore'
import { useStatsStore } from './statsStore'

const settings = { questionCount: 5, difficulty: 'easy', operation: 'addition' } as const

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
    expect(store.gameState!.questions).toHaveLength(5)
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
    for (let i = 0; i < 5; i++) {
      answer(store, true)
      vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
    }
    expect(store.screen).toBe('result')
    expect(store.gameState).toBeNull()
    expect(store.result!.outcome).toMatchObject({
      endReason: 'clear',
      correctCount: 5,
      totalAnswered: 5,
    })
    expect(stats.records).toHaveLength(before + 1)
    expect(stats.records[0]).toMatchObject({ ...settings, endReason: 'clear', correctCount: 5 })
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
      for (let i = 0; i < 5 && store.gameState; i++) {
        answer(store, i < correctAnswers)
        vi.advanceTimersByTime(FEEDBACK_DURATION_MS)
      }
      return store.result!
    }
    expect(play(4).isBestScore).toBe(true)
    expect(play(3).isBestScore).toBe(false)
    expect(play(5).isBestScore).toBe(true)
  })

  it('retries with the previous settings when startGame gets none', () => {
    const store = useGameStore()
    store.startGame({ questionCount: 15, difficulty: 'hard', operation: 'division' })
    store.goHome()
    store.startGame()
    expect(store.gameState!.settings).toEqual({
      questionCount: 15,
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
})
