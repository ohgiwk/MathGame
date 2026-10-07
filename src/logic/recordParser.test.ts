import { describe, it, expect } from 'vitest'
import { parseRecords } from './recordParser'

const valid = {
  id: 'a',
  playedAt: 1_700_000_000_000,
  difficulty: 'easy',
  operation: 'addition',
  questionCount: 5,
  endReason: 'clear',
  correctCount: 5,
  totalAnswered: 5,
  elapsedSeconds: 10,
  score: 975,
}

describe('parseRecords', () => {
  it('returns nothing for anything that is not an array', () => {
    expect(parseRecords(null)).toEqual([])
    expect(parseRecords({ records: [valid] })).toEqual([])
  })

  it('keeps valid records as they are', () => {
    expect(parseRecords([valid])).toEqual([valid])
  })

  it('computes the score of records saved before scoring existed', () => {
    const legacy: Record<string, unknown> = { ...valid }
    delete legacy.score
    expect(parseRecords([legacy])).toEqual([valid])
  })

  it.each([
    ['a non-object', 'x'],
    ['null', null],
    ['an unknown difficulty', { ...valid, difficulty: 'extreme' }],
    ['an unknown operation', { ...valid, operation: 'modulo' }],
    ['an unknown question count', { ...valid, questionCount: 7 }],
    ['an unknown end reason', { ...valid, endReason: 'quit' }],
    ['a missing id', { ...valid, id: undefined }],
    ['a non-numeric count', { ...valid, correctCount: '5' }],
    ['a NaN time', { ...valid, elapsedSeconds: NaN }],
  ])('drops %s', (_name, entry) => {
    expect(parseRecords([entry, valid])).toEqual([valid])
  })
})
