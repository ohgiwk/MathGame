<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  TIME_LIMIT_LENGTHS,
  TIME_LIMIT_LABELS,
} from '../logic/labels'
import { TIME_LIMIT_SECONDS } from '../logic/constants'

const store = useGameStore()
const preferences = usePreferencesStore()
</script>

<template>
  <div class="settings-root">
    <div class="settings-inner fade-in-up">
      <!-- Header -->
      <div class="settings-header">
        <button class="back-btn" aria-label="ホームに戻る" @click="store.goHome()">‹</button>
        <h1 class="settings-title">Settings</h1>
      </div>

      <!-- ゲーム -->
      <div class="rpg-card settings-section">
        <h2 class="section-label"><span class="section-gem">◆</span> ゲーム</h2>

        <div class="setting-row">
          <div class="setting-text">
            <div id="time-limit-label" class="setting-name">制限時間</div>
            <div class="setting-desc">1問ごとに制限時間がつきます。時間切れはミスになります</div>
          </div>
          <button
            class="switch"
            role="switch"
            aria-labelledby="time-limit-label"
            :aria-checked="preferences.timeLimit"
            :class="{ on: preferences.timeLimit }"
            @click="preferences.timeLimit = !preferences.timeLimit"
          >
            <span class="switch-knob" />
          </button>
        </div>

        <div class="limit-options" :class="{ off: !preferences.timeLimit }">
          <div class="limit-lengths" role="radiogroup" aria-label="制限時間の長さ">
            <button
              v-for="len in TIME_LIMIT_LENGTHS"
              :key="len"
              class="opt-btn length-btn"
              role="radio"
              :class="{ active: preferences.timeLimitLength === len }"
              :aria-checked="preferences.timeLimitLength === len"
              :disabled="!preferences.timeLimit"
              @click="preferences.timeLimitLength = len"
            >
              {{ TIME_LIMIT_LABELS[len] }}
            </button>
          </div>
          <div class="limit-table">
            <div v-for="d in DIFFICULTIES" :key="d" class="tile limit-item">
              <div class="limit-label">{{ DIFFICULTY_LABELS[d] }}</div>
              <div class="limit-value">
                {{ TIME_LIMIT_SECONDS[preferences.timeLimitLength][d]
                }}<span class="limit-unit">秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-root {
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding: max(1.5rem, env(safe-area-inset-top)) 1rem max(2rem, env(safe-area-inset-bottom));
}
.settings-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.settings-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
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
  background: rgba(255, 255, 255, 0.05);
}
.settings-title {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--gold-light);
}

.settings-section {
  padding: 0.8rem 1rem 1rem;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.setting-text {
  flex: 1;
  min-width: 0;
}
.setting-name {
  font-size: 0.95rem;
  font-weight: 800;
}
.setting-desc {
  font-size: 0.7rem;
  color: var(--text-sub);
  margin-top: 3px;
  line-height: 1.5;
}

/* On/off switch */
.switch {
  flex-shrink: 0;
  position: relative;
  width: 52px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 99px;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  padding: 0;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}
.switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--text-sub);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}
.switch.on {
  border-color: var(--gold);
  background: linear-gradient(135deg, #3a3416, #2a2510);
  box-shadow: 0 0 10px rgba(var(--gold-rgb), 0.3);
}
.switch.on .switch-knob {
  transform: translateX(22px);
  background: var(--gold-light);
}

.limit-options {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: opacity 0.2s ease;
}
.limit-options.off {
  opacity: 0.4;
}
.limit-lengths,
.limit-table {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}
.length-btn {
  padding: 8px 0;
  font-size: 0.9rem;
  font-weight: 700;
}
.length-btn:disabled {
  cursor: default;
}
.limit-item {
  border-radius: 10px;
  padding: 6px 2px 7px;
}
.limit-label {
  font-size: 0.62rem;
  color: var(--text-sub);
  letter-spacing: 0.06em;
}
.limit-value {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--gem-teal);
  font-variant-numeric: tabular-nums;
}
.limit-unit {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-sub);
  margin-left: 1px;
}
</style>
