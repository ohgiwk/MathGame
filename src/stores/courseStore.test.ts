import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCourseStore } from './courseStore'
import { useStatsStore } from './statsStore'
import { generateDailyCourses } from '../logic/courseGenerator'
import { levelFromExp, totalExp } from '../logic/level'

/** Saves a cleared game worth `score`, raising the player's level */
function play(score: number) {
  useStatsStore().addRecord({
    difficulty: 'normal',
    operation: 'addition',
    questionCount: 10,
    endReason: 'clear',
    correctCount: 10,
    totalAnswered: 10,
    elapsedSeconds: 30,
    score,
  })
}

function currentLevel(): number {
  return levelFromExp(totalExp(useStatsStore().records)).level
}

function clearAll(store: ReturnType<typeof useCourseStore>) {
  store.courses.forEach((c) => store.markCleared(c.id))
}

describe('courseStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 17, 12))
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("sets the day's courses for the level, keeping them through a level up", () => {
    play(150_000)
    const level = currentLevel()
    expect(level).toBeGreaterThan(20)

    const store = useCourseStore()
    expect(store.level).toBe(level)
    const courses = generateDailyCourses(level, '2026-10-17')
    expect(store.courses).toEqual(courses)

    play(150_000)
    store.refreshDay()
    expect(currentLevel()).toBeGreaterThan(level)
    expect(store.courses).toEqual(courses)

    // the next day the courses are set again, for the level reached by then
    vi.setSystemTime(new Date(2026, 9, 18, 9))
    store.refreshDay()
    expect(store.level).toBe(currentLevel())
    expect(store.courses).toEqual(generateDailyCourses(currentLevel(), '2026-10-18'))
  })

  it('starts a beginner on level 1 courses', () => {
    const store = useCourseStore()
    expect(store.level).toBe(1)
    expect(store.courses.length).toBeGreaterThanOrEqual(2)
    expect(store.courses.every((c) => c.difficulty === 'easy')).toBe(true)
  })

  it('checks cleared courses for the day and counts the days with all of them cleared', () => {
    const store = useCourseStore()
    const [a] = store.courses

    store.markCleared(a.id)
    expect(store.isCleared(a.id)).toBe(true)
    expect(store.clearedCount).toBe(1)
    expect(store.allClearedToday).toBe(false)
    expect(store.streak).toBe(0)
    expect(store.nextCourse(a.id)).toBe(store.courses[1])

    clearAll(store)
    expect(store.allClearedToday).toBe(true)
    expect(store.nextCourse(a.id)).toBeNull()
    expect(store.streak).toBe(1)

    // the next day there are new courses to clear, and the streak holds until the day is missed
    vi.setSystemTime(new Date(2026, 9, 18, 9))
    store.refreshDay()
    expect(store.clearedCount).toBe(0)
    expect(store.streak).toBe(1)

    // a course of the day before no longer counts
    store.markCleared(a.id)
    expect(store.clearedCount).toBe(0)

    clearAll(store)
    expect(store.streak).toBe(2)
    expect(store.completedDays).toEqual(['2026-10-17', '2026-10-18'])

    vi.setSystemTime(new Date(2026, 9, 20, 9))
    store.refreshDay()
    expect(store.streak).toBe(0)
    expect(store.bestStreak).toBe(2)
  })

  it('forgets every cleared course and sets level 1 courses again when the records are reset', () => {
    play(150_000)
    const store = useCourseStore()
    clearAll(store)
    expect(store.streak).toBe(1)

    useStatsStore().clearRecords()
    store.reset()
    expect(store.level).toBe(1)
    expect(store.courses).toEqual(generateDailyCourses(1, '2026-10-17'))
    expect(store.clearedCount).toBe(0)
    expect(store.streak).toBe(0)
    expect(store.bestStreak).toBe(0)
    expect(store.completedDays).toEqual([])

    // nothing of it comes back from storage
    setActivePinia(createPinia())
    const reloaded = useCourseStore()
    expect(reloaded.level).toBe(1)
    expect(reloaded.completedDays).toEqual([])
  })

  it('celebrates a day once, right after its last course is cleared', () => {
    const store = useCourseStore()
    const [a, ...rest] = store.courses
    store.markCleared(a.id)
    expect(store.takeCelebration()).toBe(false)

    rest.forEach((c) => store.markCleared(c.id))
    expect(store.takeCelebration()).toBe(true)
    expect(store.takeCelebration()).toBe(false)

    // clearing a course again on a completed day is nothing new
    store.markCleared(a.id)
    expect(store.takeCelebration()).toBe(false)
  })
})
