import { describe, it, expect, vi } from 'vitest'
import { createSoundPlayer, soundDuration, unlockOnUserInput, SOUNDS } from './sound'

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
  it('keeps every effect short', () => {
    for (const spec of Object.values(SOUNDS)) {
      expect(soundDuration(spec)).toBeGreaterThanOrEqual(0.1)
      expect(soundDuration(spec)).toBeLessThanOrEqual(0.3)
    }
  })

  it('pitches the miss below the correct answer', () => {
    const lowest = (name: keyof typeof SOUNDS) =>
      Math.min(...SOUNDS[name].notes.map((n) => n.frequency))
    expect(SOUNDS.incorrect.notes[0].frequency).toBeLessThan(lowest('correct'))
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
