import { describe, it, expect } from 'vitest'
import {
  formatQuestion,
  formatScore,
  formatElapsedTime,
  formatTotalTime,
  formatAverageTime,
  formatPlayedAt,
  formatPlayedDate,
} from './format'

describe('formatQuestion', () => {
  it('joins the operands with the operator symbol', () => {
    expect(
      formatQuestion({ id: 'x', operandA: 12, operandB: 3, operation: 'division', answer: 4 }),
    ).toBe('12 ÷ 3')
  })
})

describe('formatScore', () => {
  it('groups thousands', () => {
    expect(formatScore(1234567)).toBe('1,234,567')
  })
})

describe('formatElapsedTime', () => {
  it('pads the seconds to two digits', () => {
    expect(formatElapsedTime(5)).toBe('0分05秒')
    expect(formatElapsedTime(83)).toBe('1分23秒')
  })

  it('drops the fraction of a second', () => {
    expect(formatElapsedTime(59.96)).toBe('0分59秒')
    expect(formatTotalTime(125.7)).toBe('2分5秒')
  })
})

describe('formatAverageTime', () => {
  it('divides the time by the questions answered, to a tenth of a second', () => {
    expect(formatAverageTime(32, 10)).toBe('3.2秒')
    expect(formatAverageTime(20, 3)).toBe('6.7秒')
    expect(formatAverageTime(30, 10)).toBe('3.0秒')
  })

  it('switches to minutes from a minute up', () => {
    expect(formatAverageTime(130, 2)).toBe('1分05秒')
  })

  it('has nothing to show when no question was answered', () => {
    expect(formatAverageTime(4, 0)).toBeNull()
  })
})

describe('formatTotalTime', () => {
  it('uses the largest two units that apply', () => {
    expect(formatTotalTime(45)).toBe('45秒')
    expect(formatTotalTime(125)).toBe('2分5秒')
    expect(formatTotalTime(3725)).toBe('1時間2分')
  })
})

describe('formatPlayedAt', () => {
  it('shows month/day and a zero-padded local time', () => {
    expect(formatPlayedAt(new Date(2026, 2, 5, 9, 7).getTime())).toBe('3/5 09:07')
  })
})

describe('formatPlayedDate', () => {
  it('shows the month and day only', () => {
    expect(formatPlayedDate(new Date(2026, 9, 15, 21, 35).getTime())).toBe('10/15')
  })
})
