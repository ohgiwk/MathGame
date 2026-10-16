import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { TimeLimitLength } from '../types/game'
import { TIME_LIMIT_LENGTHS } from '../logic/labels'

const STORAGE_KEY = 'math-kingdom:preferences'

interface Preferences {
  timeLimit: boolean
  /** kept while the time limit is off, so turning it back on restores the choice */
  timeLimitLength: TimeLimitLength
}

const DEFAULTS: Preferences = { timeLimit: false, timeLimitLength: 'normal' }

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const stored = raw ? (JSON.parse(raw) as Partial<Record<keyof Preferences, unknown>>) : {}
    return {
      timeLimit: typeof stored.timeLimit === 'boolean' ? stored.timeLimit : DEFAULTS.timeLimit,
      timeLimitLength: (TIME_LIMIT_LENGTHS as unknown[]).includes(stored.timeLimitLength)
        ? (stored.timeLimitLength as TimeLimitLength)
        : DEFAULTS.timeLimitLength,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

/** Options chosen on the settings screen, kept across visits */
export const usePreferencesStore = defineStore('preferences', () => {
  const initial = loadPreferences()
  const timeLimit = ref(initial.timeLimit)
  const timeLimitLength = ref(initial.timeLimitLength)

  watch([timeLimit, timeLimitLength], () => {
    const prefs: Preferences = {
      timeLimit: timeLimit.value,
      timeLimitLength: timeLimitLength.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // storage unavailable: the choice lasts for this session only
    }
  })

  return { timeLimit, timeLimitLength }
})
