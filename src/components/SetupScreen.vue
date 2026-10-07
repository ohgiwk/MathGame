<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import type { QuestionCount, Difficulty, Operation } from '../types/game'

const store = useGameStore()

const selectedCount = ref<QuestionCount>(store.settings.questionCount)
const selectedDifficulty = ref<Difficulty>(store.settings.difficulty)
const selectedOperation = ref<Operation>(store.settings.operation)

const counts: { value: QuestionCount; label: string }[] = [
  { value: 5, label: '5問' },
  { value: 10, label: '10問' },
  { value: 15, label: '15問' },
]

const difficulties: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: '易しい', desc: '1桁' },
  { value: 'normal', label: '普通', desc: '2桁' },
  { value: 'hard', label: '難しい', desc: '3桁' },
]

const operations: { value: Operation; label: string; symbol: string }[] = [
  { value: 'addition', label: '足し算', symbol: '＋' },
  { value: 'subtraction', label: '引き算', symbol: '－' },
  { value: 'multiplication', label: '掛け算', symbol: '×' },
  { value: 'division', label: '割り算', symbol: '÷' },
  { value: 'mixed', label: 'ミックス', symbol: '✦' },
]

function handleStart() {
  store.startGame({
    questionCount: selectedCount.value,
    difficulty: selectedDifficulty.value,
    operation: selectedOperation.value,
  })
}
</script>

<template>
  <div class="setup-root">

    <!-- Header -->
    <div class="setup-header fade-in-up">
      <div class="temple-icon">⬡</div>
      <h1 class="setup-title">数の王国</h1>
      <p class="setup-sub">神殿の試練を突破せよ</p>
    </div>

    <div class="setup-body fade-in-up">

      <!-- 問題数 -->
      <div class="rpg-card setup-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 問題数
        </h2>
        <div class="grid-3">
          <button
            v-for="c in counts"
            :key="c.value"
            class="opt-btn"
            :class="{ active: selectedCount === c.value }"
            @click="selectedCount = c.value"
          >
            <span class="opt-main">{{ c.label }}</span>
          </button>
        </div>
      </div>

      <!-- 難易度 -->
      <div class="rpg-card setup-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 難易度
        </h2>
        <div class="grid-3">
          <button
            v-for="d in difficulties"
            :key="d.value"
            class="opt-btn"
            :class="{ active: selectedDifficulty === d.value }"
            @click="selectedDifficulty = d.value"
          >
            <div class="opt-main">{{ d.label }}</div>
            <div class="opt-sub">{{ d.desc }}</div>
          </button>
        </div>
      </div>

      <!-- 計算の種類 -->
      <div class="rpg-card setup-section">
        <h2 class="section-label">
          <span class="section-gem">◆</span> 計算の種類
        </h2>
        <div class="grid-ops">
          <button
            v-for="op in operations"
            :key="op.value"
            class="opt-btn"
            :class="{ active: selectedOperation === op.value }"
            @click="selectedOperation = op.value"
          >
            <div class="opt-symbol">{{ op.symbol }}</div>
            <div class="opt-sub">{{ op.label }}</div>
          </button>
        </div>
      </div>

      <!-- スタートボタン -->
      <button class="btn-gem start-btn" @click="handleStart">
        ゲーム開始
      </button>
      <button class="btn-ghost" @click="store.openStats()">
        記録を見る
      </button>
    </div>
  </div>
</template>

<style scoped>
.setup-root {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: max(2rem, env(safe-area-inset-top)) 1rem max(2rem, env(safe-area-inset-bottom));
}

.setup-header {
  text-align: center;
  margin-top: auto;
  margin-bottom: 1.25rem;
}

.temple-icon {
  font-size: 2.4rem;
  line-height: 1.2;
  color: var(--gold);
  filter: drop-shadow(0 0 10px rgba(201,168,54,0.5));
  margin-bottom: 0.4rem;
  display: block;
}

.setup-title {
  font-size: 2.2rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 60%, #A07820 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.08em;
  line-height: 1.2;
  animation: title-glow 2.2s ease-in-out infinite;
}
@keyframes title-glow {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(201,168,54,0.25)); }
  50%      { filter: drop-shadow(0 0 14px rgba(224,192,96,0.7)); }
}

.setup-sub {
  color: var(--text-sub);
  font-size: 0.85rem;
  margin-top: 0.3rem;
  letter-spacing: 0.1em;
}

.setup-body {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: auto;
}

.setup-section { padding: 1rem 1.1rem; }

.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-sub);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.section-gem {
  color: var(--gem-blue);
  font-size: 0.6rem;
  filter: drop-shadow(0 0 4px var(--gem-blue));
}

.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }

.grid-ops { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem; }
.grid-ops .opt-btn { padding: 10px 0; }
.grid-ops .opt-sub { font-size: 0.6rem; white-space: nowrap; }

/* Active option: pop when selected, then a light keeps circling the border */
@property --opt-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.opt-btn.active {
  position: relative;
  border-color: rgba(201,168,54,0.45);
  animation: opt-select 0.35s ease, opt-glow 2.2s ease-in-out 0.35s infinite;
}
.opt-btn.active::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(
    from var(--opt-angle),
    transparent 0%,
    transparent 55%,
    var(--gold) 75%,
    #FFF3C4 92%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  filter: drop-shadow(0 0 3px rgba(224,192,96,0.5));
  opacity: 0.55;
  pointer-events: none;
  animation: opt-spin 2.4s linear infinite;
}
@keyframes opt-select {
  0%   { transform: scale(0.92); }
  55%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes opt-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(201,168,54,0.25), inset 0 1px 0 rgba(201,168,54,0.1); }
  50%      { box-shadow: 0 0 22px rgba(201,168,54,0.55), inset 0 1px 0 rgba(201,168,54,0.2); }
}
@keyframes opt-spin {
  to { --opt-angle: 360deg; }
}
@media (prefers-reduced-motion: reduce) {
  .opt-btn.active { animation: none; border-color: var(--gold); }
  .opt-btn.active::before { display: none; }
  .setup-title { animation: none; }
}

.opt-main { font-size: 1rem; font-weight: 700; }
.opt-sub  { font-size: 0.7rem; opacity: 0.65; margin-top: 2px; }
.opt-symbol { font-size: 1.3rem; font-weight: 800; }

.start-btn {
  margin-top: 0.25rem;
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  padding: 18px;
  background: linear-gradient(135deg, #2A4AD0 0%, #5B2ED0 100%);
  box-shadow: 0 4px 24px rgba(76,90,255,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
}

/* Compact layout so short screens fit without scrolling */
@media (max-height: 780px) {
  .setup-root { padding-top: max(0.8rem, env(safe-area-inset-top)); padding-bottom: max(0.8rem, env(safe-area-inset-bottom)); }
  .setup-header { margin-bottom: 0.7rem; }
  .temple-icon { font-size: 1.8rem; margin-bottom: 0; }
  .setup-title { font-size: 1.8rem; }
  .setup-body { gap: 0.6rem; }
  .setup-section { padding: 0.7rem 0.9rem; }
  .section-label { margin-bottom: 0.5rem; }
  .start-btn { padding: 14px; margin-top: 0; }
  .setup-body .btn-ghost { padding: 10px; }
}
</style>
