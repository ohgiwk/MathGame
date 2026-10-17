import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCourseStore } from './courseStore'

const easy = { difficulty: 'easy', operation: 'addition', questionCount: 10 } as const
const hard = { difficulty: 'hard', operation: 'division', questionCount: 20 } as const

describe('courseStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 17, 12))
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds, edits, reorders and removes courses', () => {
    const store = useCourseStore()
    store.addCourse(easy)
    store.addCourse({ ...hard, operation: 'mixed', mixedOperations: ['addition', 'division'] })
    const [first, second] = store.courses
    expect(second).toMatchObject({ operation: 'mixed', mixedOperations: ['addition', 'division'] })

    // operations picked for a mix are dropped once the course is no longer a mix
    store.updateCourse(second.id, { ...hard, mixedOperations: ['addition', 'division'] })
    expect(store.courses[1]).toEqual({ id: second.id, ...hard })

    store.moveCourse(second.id, -1)
    expect(store.courses.map((c) => c.id)).toEqual([second.id, first.id])
    store.moveCourse(second.id, -1)
    expect(store.courses.map((c) => c.id)).toEqual([second.id, first.id])

    store.removeCourse(second.id)
    expect(store.courses.map((c) => c.id)).toEqual([first.id])
  })

  it('checks cleared courses for the day and counts the days with all of them cleared', () => {
    const store = useCourseStore()
    store.addCourse(easy)
    store.addCourse(hard)
    const [a, b] = store.courses

    store.markCleared(a.id)
    expect(store.isCleared(a.id)).toBe(true)
    expect(store.clearedCount).toBe(1)
    expect(store.allClearedToday).toBe(false)
    expect(store.streak).toBe(0)

    store.markCleared(b.id)
    expect(store.allClearedToday).toBe(true)
    expect(store.streak).toBe(1)

    // the next day the checks reset, but the streak holds until the day is missed
    vi.setSystemTime(new Date(2026, 9, 18, 9))
    store.refreshDay()
    expect(store.clearedCount).toBe(0)
    expect(store.streak).toBe(1)
    store.markCleared(a.id)
    store.markCleared(b.id)
    expect(store.streak).toBe(2)

    vi.setSystemTime(new Date(2026, 9, 20, 9))
    store.refreshDay()
    expect(store.streak).toBe(0)
    expect(store.bestStreak).toBe(2)
  })

  it('completes the day when the last uncleared course is removed', () => {
    const store = useCourseStore()
    store.addCourse(easy)
    store.addCourse(hard)
    const [a, b] = store.courses
    store.markCleared(a.id)
    store.removeCourse(b.id)
    expect(store.allClearedToday).toBe(true)
    expect(store.streak).toBe(1)
  })
})
