import { describe, it, expect } from 'vitest'
import { timeGreeting, courseGreetingMessage } from './greeting'

describe('timeGreeting', () => {
  it('changes with the time of day', () => {
    expect(timeGreeting(3)).toBe('こんばんは！')
    expect(timeGreeting(4)).toBe('おはよう！')
    expect(timeGreeting(10)).toBe('おはよう！')
    expect(timeGreeting(11)).toBe('こんにちは！')
    expect(timeGreeting(17)).toBe('こんにちは！')
    expect(timeGreeting(18)).toBe('こんばんは！')
    expect(timeGreeting(23)).toBe('こんばんは！')
  })
})

describe('courseGreetingMessage', () => {
  it('points at the next day of a running streak', () => {
    expect(courseGreetingMessage(3, 2, 2)).toBe('今日もクリアして 4日連続 をめざそう')
  })

  it('counts the courses left once some are cleared', () => {
    expect(courseGreetingMessage(0, 1, 3)).toBe('のこり 1ミッション、がんばろう')
  })

  it('invites to start when nothing is cleared yet', () => {
    expect(courseGreetingMessage(0, 2, 2)).toBe('今日のミッションに挑戦しよう')
  })
})
