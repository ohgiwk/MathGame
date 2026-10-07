<script setup lang="ts">
import { useGameStore } from './stores/gameStore'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultScreen from './components/ResultScreen.vue'

const store = useGameStore()
</script>

<template>
  <Transition name="screen" mode="out-in">
    <SetupScreen v-if="store.screen === 'setup'" key="setup" />
    <GameScreen v-else-if="store.screen === 'game'" key="game" />
    <ResultScreen v-else-if="store.screen === 'result'" key="result" />
  </Transition>
</template>
