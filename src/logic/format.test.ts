import { describe, it, expect } from 'vitest'
import {
  formatQuestion,
  formatScore,
  formatElapsedTime,
  formatTotalTime,
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
