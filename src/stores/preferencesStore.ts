import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ThemePreference, TimeLimitLength } from '../types/game'
import { THEME_PREFERENCES, TIME_LIMIT_LENGTHS } from '../logic/labels'

// index.html reads the theme from this key before the app loads; keep the two in step
const STORAGE_KEY = 'math-kingdom:preferences'

interface Preferences {
  timeLimit: boolean
  /** kept while the time limit is off, so turning it back on restores the choice */
  timeLimitLength: TimeLimitLength
  theme: ThemePreference
}

const DEFAULTS: Preferences = { timeLimit: false, timeLimitLength: 'normal', theme: 'auto' }

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const stored = raw ? (JSON.parse(raw) as Partial<Record<keyof Preferences, unknown>>) : {}
    return {
      timeLimit: typeof stored.timeLimit === 'boolean' ? stored.timeLimit : DEFAULTS.timeLimit,
      timeLimitLength: (TIME_LIMIT_LENGTHS as unknown[]).includes(stored.timeLimitLength)
        ? (stored.timeLimitLength as TimeLimitLength)
        : DEFAULTS.timeLimitLength,
      theme: (THEME_PREFERENCES as unknown[]).includes(stored.theme)
        ? (stored.theme as ThemePreference)
        : DEFAULTS.theme,
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
  const theme = ref(initial.theme)

  watch([timeLimit, timeLimitLength, theme], () => {
    const prefs: Preferences = {
      timeLimit: timeLimit.value,
      timeLimitLength: timeLimitLength.value,
      theme: theme.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // storage unavailable: the choice lasts for this session only
    }
  })

  return { timeLimit, timeLimitLength, theme }
})
