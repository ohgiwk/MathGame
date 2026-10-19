import { describe, it, expect } from 'vitest'
import { gameKindLabel } from './labels'

describe('gameKindLabel', () => {
  it('names the difficulty, the operation and the length', () => {
    expect(gameKindLabel({ difficulty: 'normal', operation: 'addition', questionCount: 10 })).toBe(
      '普通 · 足し算 · 10問',
    )
    expect(
      gameKindLabel({
        difficulty: 'hard',
        operation: 'mixed',
        mixedOperations: ['addition', 'subtraction'],
        questionCount: 30,
      }),
    ).toBe('難しい · ミックス（+−） · 30問')
  })

  it('calls an endless game endless', () => {
    expect(
      gameKindLabel({ difficulty: 'easy', operation: 'division', questionCount: 'endless' }),
    ).toBe('易しい · 割り算 · エンドレス')
  })
})
