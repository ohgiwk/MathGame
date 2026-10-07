import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import './styles/main.css'
import App from './App.vue'

// Keep the app exactly as tall as the visible area (shrinks when the iOS keyboard opens)
const viewport = window.visualViewport
if (viewport) {
  const syncAppHeight = () => {
    document.documentElement.style.setProperty(
      '--app-height',
      `${viewport.height * viewport.scale}px`,
    )
    window.scrollTo(0, 0)
  }
  viewport.addEventListener('resize', syncAppHeight)
  viewport.addEventListener('scroll', syncAppHeight)
  window.addEventListener('resize', syncAppHeight)
  syncAppHeight()
}

createApp(App).use(createPinia()).mount('#app')
