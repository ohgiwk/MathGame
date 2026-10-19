import { describe, it, expect, vi } from 'vitest'
import { createSoundPlayer, expTickPitch, soundDuration, unlockOnUserInput, SOUNDS } from './sound'

interface FakeOscillator {
  type: string
  frequencies: number[]
  started: number
  stopped: number
}

/** Just enough of an AudioContext to see which notes are scheduled */
function fakeContext(state: AudioContextState = 'suspended') {
  const oscillators: FakeOscillator[] = []
  const param = (onSet: (v: number) => void = () => {}) => ({
    setValueAtTime: (v: number) => onSet(v),
    exponentialRampToValueAtTime: (v: number) => onSet(v),
  })
  const ctx = {
    state,
    currentTime: 2,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createGain: () => ({ gain: param(), connect: (node: unknown) => node }),
    createOscillator: () => {
      const osc: FakeOscillator = { type: '', frequencies: [], started: -1, stopped: -1 }
      oscillators.push(osc)
      return {
        set type(t: string) {
          osc.type = t
        },
        frequency: param((v) => osc.frequencies.push(v)),
        connect: (node: unknown) => node,
        start: (t: number) => (osc.started = t),
        stop: (t: number) => (osc.stopped = t),
      }
    },
  }
  return { ctx, oscillators, create: () => ctx as unknown as AudioContext }
}

describe('SOUNDS', () => {
  it('keeps the answer effects short, so they finish before the next question', () => {
    for (const spec of [SOUNDS.correct, SOUNDS.incorrect]) {
      expect(soundDuration(spec)).toBeGreaterThanOrEqual(0.1)
      expect(soundDuration(spec)).toBeLessThanOrEqual(0.3)
    }
  })

  it('keeps the result effects to about half a second', () => {
    for (const spec of [SOUNDS.clear, SOUNDS.gameover]) {
      expect(soundDuration(spec)).toBeLessThanOrEqual(0.5)
    }
  })

  it('keeps a key tap brief, so fast typing does not pile sounds up', () => {
    expect(soundDuration(SOUNDS.tap)).toBeLessThanOrEqual(0.05)
  })

  it('keeps an EXP tick shorter than the gap between ticks', () => {
    expect(soundDuration(SOUNDS.expTick)).toBeLessThanOrEqual(0.06)
  })

  it('rises for a clear and falls for a game over', () => {
    const pitches = (name: keyof typeof SOUNDS) => SOUNDS[name].notes.map((n) => n.frequency)
    const rising = (fs: number[]) => fs.every((f, i) => i === 0 || f > fs[i - 1])
    expect(rising(pitches('clear'))).toBe(true)
    expect(rising([...pitches('gameover')].reverse())).toBe(true)
  })

  it('pitches the miss below the correct answer', () => {
    const lowest = (name: keyof typeof SOUNDS) =>
      Math.min(...SOUNDS[name].notes.map((n) => n.frequency))
    expect(SOUNDS.incorrect.notes[0].frequency).toBeLessThan(lowest('correct'))
  })
})

describe('expTickPitch', () => {
  it('rises an octave from an empty bar to a full one', () => {
    expect(expTickPitch(0)).toBe(1)
    expect(expTickPitch(0.5)).toBeCloseTo(Math.SQRT2)
    expect(expTickPitch(1)).toBe(2)
  })

  it('stays within the octave for ratios out of range', () => {
    expect(expTickPitch(-0.2)).toBe(1)
    expect(expTickPitch(1.5)).toBe(2)
  })
})

describe('createSoundPlayer', () => {
  it('schedules each note of a sound from the current time', () => {
    const fake = fakeContext('running')
    createSoundPlayer(fake.create).play('correct')

    expect(fake.oscillators).toHaveLength(SOUNDS.correct.notes.length)
    SOUNDS.correct.notes.forEach((note, i) => {
      const osc = fake.oscillators[i]
      expect(osc.type).toBe(SOUNDS.correct.wave)
      expect(osc.frequencies[0]).toBe(note.frequency)
      expect(osc.started).toBeCloseTo(2 + note.start)
      expect(osc.stopped).toBeCloseTo(2 + note.start + note.duration)
    })
  })

  it('shifts every frequency by the pitch', () => {
    const fake = fakeContext('running')
    createSoundPlayer(fake.create).play('incorrect', 2)
    const note = SOUNDS.incorrect.notes[0]
    expect(fake.oscillators[0].frequencies).toEqual([note.frequency * 2, note.endFrequency! * 2])
  })

  it('slides the pitch of a note that has an end frequency', () => {
    const fake = fakeContext('running')
    createSoundPlayer(fake.create).play('incorrect')
    const note = SOUNDS.incorrect.notes[0]
    expect(fake.oscillators[0].frequencies).toEqual([note.frequency, note.endFrequency])
  })

  it('makes a single context, only once it is needed', () => {
    const fake = fakeContext()
    const create = vi.fn(fake.create)
    const player = createSoundPlayer(create)
    expect(create).not.toHaveBeenCalled()

    player.unlock()
    player.play('correct')
    player.play('incorrect')
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('resumes the context on unlock until it runs', () => {
    const fake = fakeContext('suspended')
    const player = createSoundPlayer(fake.create)
    player.unlock()
    expect(fake.ctx.resume).toHaveBeenCalledTimes(1)

    fake.ctx.state = 'running'
    player.unlock()
    expect(fake.ctx.resume).toHaveBeenCalledTimes(1)
  })

  it('stays silent without the Web Audio API', () => {
    const missing = createSoundPlayer(() => null)
    expect(() => {
      missing.unlock()
      missing.play('correct')
    }).not.toThrow()

    const failing = createSoundPlayer(() => {
      throw new Error('no audio')
    })
    expect(() => {
      failing.unlock()
      failing.play('incorrect')
    }).not.toThrow()
  })
})

describe('unlockOnUserInput', () => {
  it('unlocks on taps and key presses', () => {
    const target = new EventTarget()
    const player = { unlock: vi.fn(), play: vi.fn() }
    unlockOnUserInput(player, target)

    target.dispatchEvent(new Event('touchend'))
    target.dispatchEvent(new Event('keydown'))
    expect(player.unlock).toHaveBeenCalledTimes(2)
    expect(player.play).not.toHaveBeenCalled()
  })
})
