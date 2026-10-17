import type { Theme, ThemePreference } from '../types/game'

/**
 * theme-color for the browser chrome in each theme, matching the top of the page.
 * index.html sets the same values before the app loads; keep the two in step.
 */
export const THEME_COLORS: Record<Theme, string> = {
  dark: '#0e1a35',
  light: '#f5f0e6',
}

/** The theme to draw, given the player's choice and whether the device is set to dark */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === 'auto') return systemPrefersDark ? 'dark' : 'light'
  return preference
}
