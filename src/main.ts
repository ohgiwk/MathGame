import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import './styles/main.css'
import App from './App.vue'

/** env(safe-area-inset-top) in px, which a script can only read off an element using it */
function safeAreaTop(): number {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top)'
  document.body.append(probe)
  const top = parseFloat(getComputedStyle(probe).paddingTop) || 0
  probe.remove()
  return top
}

/**
 * How far the screen reaches below the viewport iOS reports. In a home screen app with the
 * translucent status bar, the page starts at the very top of the screen, yet iOS gives every height
 * (innerHeight, the visual viewport, 100%) short by about the top safe area, which left a bare strip
 * at the bottom. Only a gap of that size is this bug; any other (a resized iPad window, a fixed iOS)
 * is left alone.
 */
function standaloneGap(): number {
  if ((navigator as Navigator & { standalone?: boolean }).standalone !== true) return 0
  const portrait = window.innerWidth < window.innerHeight
  const screenHeight = portrait
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height)
  // the root's clientHeight is the layout viewport, whatever height the CSS gives html
  const gap = screenHeight - document.documentElement.clientHeight
  return gap > 0 && gap <= safeAreaTop() + 20 ? gap : 0
}

// Keep the app exactly as tall as the visible area (shrinks when the iOS keyboard opens)
const viewport = window.visualViewport
if (viewport) {
  const syncAppHeight = () => {
    document.documentElement.style.setProperty(
      '--app-height',
      `${viewport.height * viewport.scale + standaloneGap()}px`,
    )
    window.scrollTo(0, 0)
  }
  viewport.addEventListener('resize', syncAppHeight)
  viewport.addEventListener('scroll', syncAppHeight)
  window.addEventListener('resize', syncAppHeight)
  syncAppHeight()
}

// iOS Safari only applies :active styles to elements when a touch listener exists
document.addEventListener('touchstart', () => {}, { passive: true })

createApp(App).use(createPinia()).mount('#app')
