import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ThemePreference, TimeLimitLength } from '../types/game'
import { THEME_PREFERENCES, TIME_LIMIT_LENGTHS } from '../logic/labels'
import { isOneOf } from '../logic/guards'
import { readJson, writeJson } from '../logic/storage'

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
  const raw = readJson(STORAGE_KEY)
  const stored: Partial<Record<keyof Preferences, unknown>> =
    typeof raw === 'object' && raw !== null ? raw : {}
  return {
    timeLimit: typeof stored.timeLimit === 'boolean' ? stored.timeLimit : DEFAULTS.timeLimit,
    timeLimitLength: isOneOf(TIME_LIMIT_LENGTHS, stored.timeLimitLength)
      ? stored.timeLimitLength
      : DEFAULTS.timeLimitLength,
    theme: isOneOf(THEME_PREFERENCES, stored.theme) ? stored.theme : DEFAULTS.theme,
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
    writeJson(STORAGE_KEY, prefs)
  })

  return { timeLimit, timeLimitLength, theme }
})
