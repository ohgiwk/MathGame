<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'

/** The frame of a screen reached from home (records, settings): a titled column with a back button */
defineProps<{ title: string }>()

const store = useGameStore()
</script>

<template>
  <div class="sub-root">
    <div class="sub-inner fade-in-up">
      <div class="sub-header">
        <button class="back-btn" aria-label="ホームに戻る" @click="store.goHome()">‹</button>
        <h1 class="sub-title">{{ title }}</h1>
      </div>
      <slot />
    </div>
    <!-- dialogs go outside the animated column, whose transform would trap position: fixed -->
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.sub-root {
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding: max(1.5rem, env(safe-area-inset-top)) 1rem max(2rem, env(safe-area-inset-bottom));
}
.sub-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.sub-header {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.6rem 0 0.9rem;
}
.back-btn {
  position: absolute;
  left: 0;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-sub);
  font-size: 1.6rem;
  line-height: 1;
  padding-bottom: 4px;
  cursor: pointer;
}
.back-btn:active {
  background: rgba(var(--wash-rgb), 0.05);
}
.sub-title {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--gold-light);
}
</style>
