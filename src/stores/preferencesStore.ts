import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { HomeMode, ThemePreference, TimeLimitLength } from '../types/game'
import { HOME_MODES, THEME_PREFERENCES, TIME_LIMIT_LENGTHS } from '../logic/labels'
import { isOneOf } from '../logic/guards'
import { readJson, writeJson } from '../logic/storage'

// index.html reads the theme from this key before the app loads; keep the two in step
const STORAGE_KEY = 'math-kingdom:preferences'

interface Preferences {
  timeLimit: boolean
  /** kept while the time limit is off, so turning it back on restores the choice */
  timeLimitLength: TimeLimitLength
  theme: ThemePreference
  soundEffects: boolean
  /** the game the home screen was last set to, from the drawer */
  homeMode: HomeMode
}

const DEFAULTS: Preferences = {
  timeLimit: false,
  timeLimitLength: 'normal',
  theme: 'auto',
  soundEffects: true,
  homeMode: 'arithmetic',
}

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
    soundEffects:
      typeof stored.soundEffects === 'boolean' ? stored.soundEffects : DEFAULTS.soundEffects,
    homeMode: isOneOf(HOME_MODES, stored.homeMode) ? stored.homeMode : DEFAULTS.homeMode,
  }
}

/** Options chosen on the settings screen, kept across visits */
export const usePreferencesStore = defineStore('preferences', () => {
  const initial = loadPreferences()
  const timeLimit = ref(initial.timeLimit)
  const timeLimitLength = ref(initial.timeLimitLength)
  const theme = ref(initial.theme)
  const soundEffects = ref(initial.soundEffects)
  const homeMode = ref(initial.homeMode)

  watch([timeLimit, timeLimitLength, theme, soundEffects, homeMode], () => {
    const prefs: Preferences = {
      timeLimit: timeLimit.value,
      timeLimitLength: timeLimitLength.value,
      theme: theme.value,
      soundEffects: soundEffects.value,
      homeMode: homeMode.value,
    }
    writeJson(STORAGE_KEY, prefs)
  })

  /** The time limit a new game is played with; undefined while it is off */
  const activeTimeLimit = computed(() => (timeLimit.value ? timeLimitLength.value : undefined))

  return { timeLimit, timeLimitLength, theme, soundEffects, homeMode, activeTimeLimit }
})
