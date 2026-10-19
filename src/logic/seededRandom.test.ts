import { describe, it, expect } from 'vitest'
import { hashSeed, pick, seededRandom } from './seededRandom'

function take(seed: string, count: number): number[] {
  const random = seededRandom(seed)
  return Array.from({ length: count }, () => random())
}

describe('seededRandom', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take('2026-10-19:normal', 20)).toEqual(take('2026-10-19:normal', 20))
  })

  it('gives a different sequence for a different seed', () => {
    expect(take('2026-10-19:normal', 5)).not.toEqual(take('2026-10-20:normal', 5))
    expect(take('2026-10-19:normal', 5)).not.toEqual(take('2026-10-19:hard', 5))
  })

  it('stays in [0, 1) and spreads over it', () => {
    const values = take('spread', 1000)
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
    const low = values.filter((v) => v < 0.5).length
    expect(low).toBeGreaterThan(400)
    expect(low).toBeLessThan(600)
  })
})

describe('hashSeed', () => {
  it('hashes a string into an unsigned 32-bit number', () => {
    expect(hashSeed('')).toBe(0x811c9dc5)
    expect(hashSeed('a')).toBe(0xe40c292c)
    expect(Number.isInteger(hashSeed('2026-10-19'))).toBe(true)
  })
})

describe('pick', () => {
  it('picks every item for some value in [0, 1)', () => {
    const items = ['a', 'b', 'c']
    expect(pick(items, () => 0)).toBe('a')
    expect(pick(items, () => 0.5)).toBe('b')
    expect(pick(items, () => 0.9999)).toBe('c')
  })
})
