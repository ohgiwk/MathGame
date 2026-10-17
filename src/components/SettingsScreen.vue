<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useStatsStore } from '../stores/statsStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  TIME_LIMIT_LENGTHS,
  TIME_LIMIT_LABELS,
  THEME_PREFERENCES,
  THEME_LABELS,
} from '../logic/labels'
import { TIME_LIMIT_SECONDS } from '../logic/constants'
import ConfirmDialog from './ConfirmDialog.vue'

const store = useGameStore()
const preferences = usePreferencesStore()
const statsStore = useStatsStore()

const showResetDialog = ref(false)
const resetDone = ref(false)

function confirmReset() {
  statsStore.clearRecords()
  showResetDialog.value = false
  resetDone.value = true
}
</script>

<template>
  <div class="settings-root">
    <div class="settings-inner fade-in-up">
      <!-- Header -->
      <div class="settings-header">
        <button class="back-btn" aria-label="ホームに戻る" @click="store.goHome()">‹</button>
        <h1 class="settings-title">Settings</h1>
      </div>

      <!-- 表示 -->
      <div class="rpg-card settings-section">
        <h2 class="section-label"><span class="section-gem">◆</span> 表示</h2>
        <div class="setting-text">
          <div id="theme-label" class="setting-name">テーマ</div>
          <div class="setting-desc">自動では端末のライト／ダークの設定に合わせます</div>
        </div>
        <div class="theme-options" role="radiogroup" aria-labelledby="theme-label">
          <button
            v-for="t in THEME_PREFERENCES"
            :key="t"
            class="opt-btn theme-btn"
            role="radio"
            :class="{ active: preferences.theme === t }"
            :aria-checked="preferences.theme === t"
            @click="preferences.theme = t"
          >
            <span class="theme-swatch" :class="`swatch-${t}`" aria-hidden="true" />
            {{ THEME_LABELS[t] }}
          </button>
        </div>
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

      <!-- 記録 -->
      <div class="rpg-card settings-section">
        <h2 class="section-label"><span class="section-gem">◆</span> 記録</h2>
        <div class="setting-row">
          <div class="setting-text">
            <div class="setting-name">記録をリセット</div>
            <div class="setting-desc">
              これまでのプレイ記録（{{ statsStore.records.length }}件）をすべて削除します
            </div>
          </div>
          <button
            class="reset-btn"
            :disabled="statsStore.records.length === 0"
            @click="showResetDialog = true"
          >
            リセット
          </button>
        </div>
        <p v-if="resetDone" class="reset-done" role="status">記録をリセットしました</p>
      </div>
    </div>

    <ConfirmDialog
      :open="showResetDialog"
      icon="⚠"
      title="記録をリセットしますか？"
      message="すべてのプレイ記録が削除され、元に戻せません"
      cancel-label="やめる"
      confirm-label="リセットする"
      @cancel="showResetDialog = false"
      @confirm="confirmReset"
    />
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
  background: rgba(var(--wash-rgb), 0.05);
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
  background: var(--bg-inset-strong);
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
  background: linear-gradient(135deg, var(--switch-on), var(--switch-on2));
  box-shadow: 0 0 10px rgba(var(--gold-rgb), 0.3);
}
.switch.on .switch-knob {
  transform: translateX(22px);
  background: var(--switch-knob-on);
}

.reset-btn {
  flex-shrink: 0;
  border: 1px solid rgba(var(--ruby-rgb), 0.6);
  border-radius: 10px;
  background: rgba(var(--ruby-rgb), 0.12);
  color: var(--danger-text);
  font-size: 0.85rem;
  font-weight: 800;
  padding: 8px 14px;
  cursor: pointer;
}
.reset-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.reset-done {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--success-text);
}

/* テーマ */
.theme-options {
  margin-top: 0.7rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}
.theme-btn {
  padding: 8px 0;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
/* a ring for light, a filled disc for dark, half of each for auto */
.theme-swatch {
  width: 12px;
  height: 12px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
}
.swatch-dark {
  background: currentColor;
}
.swatch-auto {
  background: linear-gradient(90deg, currentColor 50%, transparent 50%);
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
