import { ref, watchEffect, onScopeDispose } from 'vue'
import type { Theme } from '../types/game'
import { usePreferencesStore } from '../stores/preferencesStore'
import { resolveTheme, THEME_COLORS } from '../logic/theme'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  // index.html has one theme-color tag per device setting; the chosen theme overrides both
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', THEME_COLORS[theme])
  }
}

/** Keeps the page's theme (data-theme on <html>, and theme-color) in step with the preference */
export function useThemeSync() {
  const preferences = usePreferencesStore()
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemPrefersDark = ref(media.matches)
  const onChange = (e: MediaQueryListEvent) => {
    systemPrefersDark.value = e.matches
  }
  media.addEventListener('change', onChange)
  onScopeDispose(() => media.removeEventListener('change', onChange))

  watchEffect(() => applyTheme(resolveTheme(preferences.theme, systemPrefersDark.value)))
}
