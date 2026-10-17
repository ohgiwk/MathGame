<script setup lang="ts">
import { useGameStore } from './stores/gameStore'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultScreen from './components/ResultScreen.vue'
import StatsScreen from './components/StatsScreen.vue'
import SettingsScreen from './components/SettingsScreen.vue'
import CourseScreen from './components/CourseScreen.vue'
import PWAPrompt from './components/PWAPrompt.vue'
import { useThemeSync } from './composables/useThemeSync'

const store = useGameStore()
useThemeSync()
</script>

<template>
  <Transition name="screen" mode="out-in">
    <SetupScreen v-if="store.screen === 'setup'" key="setup" />
    <GameScreen v-else-if="store.screen === 'game'" key="game" />
    <ResultScreen v-else-if="store.screen === 'result'" key="result" />
    <StatsScreen v-else-if="store.screen === 'stats'" key="stats" />
    <SettingsScreen v-else-if="store.screen === 'settings'" key="settings" />
    <CourseScreen v-else-if="store.screen === 'courses'" key="courses" />
  </Transition>
  <PWAPrompt />
</template>
