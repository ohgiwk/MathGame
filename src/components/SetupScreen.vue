<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import type { QuestionCount, Difficulty, Operation } from '../types/game'
import {
  DIFFICULTIES,
  OPERATIONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_DESCRIPTIONS,
  OPERATION_LABELS,
} from '../logic/labels'

const store = useGameStore()

const selectedCount = ref<QuestionCount>(store.settings.questionCount)
const selectedDifficulty = ref<Difficulty>(store.settings.difficulty)
const selectedOperation = ref<Operation>(store.settings.operation)

const counts: QuestionCount[] = [5, 10, 15]

// full-width symbols for the option buttons
const operationSymbols: Record<Operation, string> = {
  addition: '＋',
  subtraction: '－',
  multiplication: '×',
  division: '÷',
  mixed: '✦',
}

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
    <div class="setup-header enter-item" style="--i: 0">
      <div class="temple-icon">⬡</div>
      <h1 class="setup-title">数の王国</h1>
      <p class="setup-sub">KINGDOM OF NUMBERS</p>
    </div>

    <div class="setup-body">
      <!-- 問題数 -->
      <div class="rpg-card setup-section enter-item" style="--i: 1">
        <h2 class="section-label"><span class="section-gem">◆</span> 問題数</h2>
        <div class="grid-3">
          <button
            v-for="c in counts"
            :key="c"
            class="opt-btn"
            :class="{ active: selectedCount === c }"
            @click="selectedCount = c"
          >
            <span class="opt-main">{{ c }}問</span>
          </button>
        </div>
      </div>

      <!-- 難易度 -->
      <div class="rpg-card setup-section enter-item" style="--i: 2">
        <h2 class="section-label"><span class="section-gem">◆</span> 難易度</h2>
        <div class="grid-3">
          <button
            v-for="d in DIFFICULTIES"
            :key="d"
            class="opt-btn"
            :class="{ active: selectedDifficulty === d }"
            @click="selectedDifficulty = d"
          >
            <div class="opt-main">{{ DIFFICULTY_LABELS[d] }}</div>
            <div class="opt-sub">{{ DIFFICULTY_DESCRIPTIONS[d] }}</div>
          </button>
        </div>
      </div>

      <!-- 計算の種類 -->
      <div class="rpg-card setup-section enter-item" style="--i: 3">
        <h2 class="section-label"><span class="section-gem">◆</span> 計算の種類</h2>
        <div class="grid-ops">
          <button
            v-for="op in OPERATIONS"
            :key="op"
            class="opt-btn"
            :class="{ active: selectedOperation === op }"
            @click="selectedOperation = op"
          >
            <div class="opt-symbol">{{ operationSymbols[op] }}</div>
            <div class="opt-sub">{{ OPERATION_LABELS[op] }}</div>
          </button>
        </div>
      </div>

      <!-- スタートボタン -->
      <button class="btn-gem btn-gold start-btn enter-item" style="--i: 4" @click="handleStart">
        <span class="btn-gold-gem">◆</span>
        <span class="btn-gold-label">START</span>
        <span class="btn-gold-gem">◆</span>
      </button>
      <button class="btn-ghost enter-item" style="--i: 5" @click="store.openStats()">
        My Records
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

/* Entrance: items fade in one after another from the top of the screen down */
.enter-item {
  animation: enter-fade 0.5s ease-out backwards;
  animation-delay: calc(var(--i) * 90ms + 80ms);
}
@keyframes enter-fade {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
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
  filter: drop-shadow(0 0 10px rgba(var(--gold-rgb), 0.5));
  margin-bottom: 0.4rem;
  display: block;
}

/* A streak of light sweeps across the gold title from left to right */
.setup-title {
  display: inline-block;
  font-size: 2.2rem;
  font-weight: 900;
  background:
    linear-gradient(100deg, transparent 44%, rgba(255, 250, 225, 0.95) 50%, transparent 56%)
      no-repeat,
    linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 60%, #a07820 100%);
  background-size:
    250% 100%,
    100% 100%;
  background-position:
    100% 0,
    0 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.08em;
  line-height: 1.2;
  filter: drop-shadow(0 0 6px rgba(var(--gold-rgb), 0.35));
  animation: title-shine 3.2s ease-in-out infinite;
}
@keyframes title-shine {
  0% {
    background-position:
      100% 0,
      0 0;
  }
  45%,
  100% {
    background-position:
      0% 0,
      0 0;
  }
}

.setup-sub {
  color: var(--text-sub);
  font-size: 0.75rem;
  margin-top: 0.3rem;
  letter-spacing: 0.28em;
}

.setup-body {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: auto;
}

.setup-section {
  padding: 1rem 1.1rem;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.grid-ops {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}
.grid-ops .opt-btn {
  padding: 10px 0;
}
.grid-ops .opt-sub {
  font-size: 0.6rem;
  white-space: nowrap;
}

/* Active option: pop when selected, then a light keeps circling the border */
@property --opt-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.opt-btn.active {
  position: relative;
  border-color: rgba(var(--gold-rgb), 0.45);
  animation:
    opt-select 0.35s ease,
    opt-glow 2.2s ease-in-out 0.35s infinite;
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
    #fff3c4 92%,
    transparent 100%
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  filter: drop-shadow(0 0 3px rgba(224, 192, 96, 0.5));
  opacity: 0.55;
  pointer-events: none;
  animation: opt-spin 2.4s linear infinite;
}
@keyframes opt-select {
  0% {
    transform: scale(0.92);
  }
  55% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes opt-glow {
  0%,
  100% {
    box-shadow:
      0 0 12px rgba(var(--gold-rgb), 0.25),
      inset 0 1px 0 rgba(var(--gold-rgb), 0.1);
  }
  50% {
    box-shadow:
      0 0 22px rgba(var(--gold-rgb), 0.55),
      inset 0 1px 0 rgba(var(--gold-rgb), 0.2);
  }
}
@keyframes opt-spin {
  to {
    --opt-angle: 360deg;
  }
}
@media (prefers-reduced-motion: reduce) {
  .enter-item {
    animation: none;
  }
  .opt-btn.active {
    animation: none;
    border-color: var(--gold);
  }
  .opt-btn.active::before {
    display: none;
  }
  .setup-title {
    animation: none;
  }
}

.opt-main {
  font-size: 1rem;
  font-weight: 700;
}
.opt-sub {
  font-size: 0.7rem;
  opacity: 0.65;
  margin-top: 2px;
}
.opt-symbol {
  font-size: 1.3rem;
  font-weight: 800;
}

.start-btn {
  margin-top: 0.25rem;
}

/* Compact layout so short screens fit without scrolling */
@media (max-height: 780px) {
  .setup-root {
    padding-top: max(0.8rem, env(safe-area-inset-top));
    padding-bottom: max(0.8rem, env(safe-area-inset-bottom));
  }
  .setup-header {
    margin-bottom: 0.7rem;
  }
  .temple-icon {
    font-size: 1.8rem;
    margin-bottom: 0;
  }
  .setup-title {
    font-size: 1.8rem;
  }
  .setup-body {
    gap: 0.6rem;
  }
  .setup-section {
    padding: 0.7rem 0.9rem;
  }
  .section-label {
    margin-bottom: 0.5rem;
  }
  .start-btn {
    padding: 14px 20px;
    margin-top: 0;
  }
  .setup-body .btn-ghost {
    padding: 10px;
  }
}
</style>
