// Short sound effects made with the Web Audio API, so the app ships no audio files.

export type SoundName =
  'correct' | 'incorrect' | 'clear' | 'gameover' | 'expTick' | 'levelUp' | 'tap' | 'start'

interface Note {
  /** seconds after the sound starts */
  start: number
  duration: number
  frequency: number
  /** the pitch slides to this by the note's end */
  endFrequency?: number
}

interface SoundSpec {
  wave: OscillatorType
  /** peak gain; kept low so the effects stay in the background */
  volume: number
  notes: Note[]
}

export const SOUNDS: Record<SoundName, SoundSpec> = {
  // a bright rising pair: A5 then E6
  correct: {
    wave: 'triangle',
    volume: 0.18,
    notes: [
      { start: 0, duration: 0.08, frequency: 880 },
      { start: 0.07, duration: 0.14, frequency: 1318.5 },
    ],
  },
  // a soft low tone that sags
  incorrect: {
    wave: 'sine',
    volume: 0.2,
    notes: [{ start: 0, duration: 0.24, frequency: 220, endFrequency: 150 }],
  },
  // on the result screen: a quick rising C major arpeggio
  clear: {
    wave: 'triangle',
    volume: 0.16,
    notes: [
      { start: 0, duration: 0.09, frequency: 523.25 },
      { start: 0.07, duration: 0.09, frequency: 659.25 },
      { start: 0.14, duration: 0.09, frequency: 783.99 },
      { start: 0.21, duration: 0.22, frequency: 1046.5 },
    ],
  },
  // on the result screen after running out of lives: a gentle falling line
  gameover: {
    wave: 'sine',
    volume: 0.18,
    notes: [
      { start: 0, duration: 0.13, frequency: 392 },
      { start: 0.12, duration: 0.13, frequency: 329.63 },
      { start: 0.24, duration: 0.26, frequency: 261.63, endFrequency: 246.94 },
    ],
  },
  // a faint blip, repeated while the EXP bar fills; its pitch follows the bar
  expTick: {
    wave: 'sine',
    volume: 0.08,
    notes: [{ start: 0, duration: 0.04, frequency: 523.25 }],
  },
  // each time the bar fills up: a sparkling pair, G6 then C7
  levelUp: {
    wave: 'triangle',
    volume: 0.16,
    notes: [
      { start: 0, duration: 0.1, frequency: 1567.98 },
      { start: 0.08, duration: 0.2, frequency: 2093 },
    ],
  },
  // a soft click for a number pad key; short enough for quick typing
  tap: {
    wave: 'triangle',
    volume: 0.1,
    notes: [{ start: 0, duration: 0.03, frequency: 1200, endFrequency: 900 }],
  },
  // a button that starts a game: a quick upward swoop into a bright note
  start: {
    wave: 'triangle',
    volume: 0.16,
    notes: [
      { start: 0, duration: 0.1, frequency: 392, endFrequency: 784 },
      { start: 0.09, duration: 0.16, frequency: 1174.66 },
    ],
  },
}

/** Pitch for an EXP tick: rises an octave as the bar goes from empty (0) to full (1) */
export function expTickPitch(ratio: number): number {
  return 2 ** Math.min(Math.max(ratio, 0), 1)
}

/** Seconds from the start of the sound to the end of its last note */
export function soundDuration(spec: SoundSpec): number {
  return Math.max(...spec.notes.map((n) => n.start + n.duration))
}

/** Time for the gain to rise, so a note starts without a click */
const ATTACK_SECONDS = 0.01
/** exponential ramps cannot reach 0 */
const SILENT_GAIN = 0.0001

export interface SoundPlayer {
  /** Starts (or restarts) audio; must run inside a user's input for iOS to allow it */
  unlock(): void
  /** `pitch` multiplies every frequency of the sound (2 is an octave up) */
  play(name: SoundName, pitch?: number): void
}

/**
 * The context is made on first use, since browsers warn about one created before any input.
 * `createContext` returns null where the Web Audio API is missing; the player then stays silent.
 */
export function createSoundPlayer(createContext: () => AudioContext | null): SoundPlayer {
  let ctx: AudioContext | null | undefined

  function context(): AudioContext | null {
    if (ctx === undefined) {
      try {
        ctx = createContext()
      } catch {
        ctx = null
      }
    }
    return ctx
  }

  function unlock() {
    const c = context()
    // iOS also leaves the context 'interrupted' after a call or a trip to the background
    if (c && c.state !== 'running') c.resume().catch(() => {})
  }

  function playNote(c: AudioContext, spec: SoundSpec, note: Note, at: number, pitch: number) {
    const start = at + note.start
    const end = start + note.duration
    const osc = c.createOscillator()
    osc.type = spec.wave
    osc.frequency.setValueAtTime(note.frequency * pitch, start)
    if (note.endFrequency !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(note.endFrequency * pitch, end)
    }
    const gain = c.createGain()
    gain.gain.setValueAtTime(SILENT_GAIN, start)
    gain.gain.exponentialRampToValueAtTime(spec.volume, start + ATTACK_SECONDS)
    gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, end)
    osc.connect(gain).connect(c.destination)
    osc.start(start)
    osc.stop(end)
  }

  function play(name: SoundName, pitch = 1) {
    const c = context()
    if (!c) return
    const spec = SOUNDS[name]
    for (const note of spec.notes) playNote(c, spec, note, c.currentTime, pitch)
  }

  return { unlock, play }
}

function browserContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

/** The app's one player, backed by the browser's audio */
export const soundPlayer = createSoundPlayer(browserContext)

/** Events that count as a user's input for unlocking audio (touchend for older iOS) */
const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'click', 'keydown'] as const

/** Unlocks the player on every input; cheap once audio runs, and recovers from interruptions */
export function unlockOnUserInput(player: SoundPlayer, target: EventTarget): void {
  for (const type of UNLOCK_EVENTS) {
    target.addEventListener(type, () => player.unlock(), { capture: true, passive: true })
  }
}
