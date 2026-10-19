import { usePreferencesStore } from '../stores/preferencesStore'
import { soundPlayer } from '../logic/sound'

/**
 * A click handler for a screen's root that sounds every button clicked inside it.
 * Buttons that cannot be used stay silent; one marked data-sound="start" starts a game.
 */
export function useButtonSounds() {
  const preferences = usePreferencesStore()
  return (e: MouseEvent) => {
    if (!preferences.soundEffects || !(e.target instanceof Element)) return
    const button = e.target.closest('button')
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return
    soundPlayer.play(button.dataset.sound === 'start' ? 'start' : 'tap')
  }
}
