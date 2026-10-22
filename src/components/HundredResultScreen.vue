<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useHundredStore } from '../stores/hundredStore'
import { useButtonSounds } from '../composables/useButtonSounds'
import { CELL_COUNT, formatLapTime } from '../logic/hundredGrid'
import { OPERATION_LABELS } from '../logic/labels'
import HundredGridView from './HundredGridView.vue'
import ExpCard from './ExpCard.vue'
import { BEST_TIME_MIN_CORRECT, countsForBestTime, missCount } from '../logic/hundredRecords'

const store = useGameStore()
const hundred = useHundredStore()
const playButtonSound = useButtonSounds()

const result = computed(() => hundred.result)
const perfect = computed(() => result.value?.correctCount === CELL_COUNT)
const best = computed(() => hundred.bestRecords[result.value?.grid.operation ?? 'addition'])
/** faster than the best before, but with more misses, so it did not take over */
const fasterWithMoreMisses = computed(() => {
  const r = result.value
  const previous = r?.previousBest
  return (
    r !== null &&
    previous !== undefined &&
    countsForBestTime(r) &&
    r.elapsedMs < previous.elapsedMs &&
    missCount(r) > missCount(previous)
  )
})
/** the EXP pours into the level bar once the result has had a moment to be read */
const EXP_DELAY_MS = 700
</script>

<template>
  <div v-if="result" class="hr-root" @click="playButtonSound">
    <div class="hr-inner fade-in-up">
      <div class="hr-header">
        <div class="hr-icon">{{ perfect ? '🏆' : '📝' }}</div>
        <h1 class="hr-title">{{ perfect ? 'PERFECT!' : 'FINISH!' }}</h1>
        <p class="hr-sub">百ます計算 · {{ OPERATION_LABELS[result.grid.operation] }}</p>
        <p v-if="result.isBestTime" class="new-best pill pill-success">ベストタイム更新！</p>
      </div>

      <div class="rpg-card hr-card">
        <p class="hr-time">{{ formatLapTime(result.elapsedMs) }}</p>
        <div class="hr-tiles">
          <div class="tile hr-tile">
            <div class="tile-label">正解</div>
            <div class="tile-value">
              {{ result.correctCount }}<small> / {{ CELL_COUNT }}</small>
            </div>
          </div>
          <div class="tile hr-tile">
            <div class="tile-label">ミス</div>
            <div class="tile-value" :class="{ miss: !perfect }">
              {{ CELL_COUNT - result.correctCount }}
            </div>
          </div>
          <div class="tile hr-tile">
            <div class="tile-label">ベスト</div>
            <div class="tile-value best">
              {{ best !== undefined ? formatLapTime(best.elapsedMs) : '—' }}
            </div>
            <div v-if="best !== undefined" class="tile-sub">ミス回数：{{ missCount(best) }}</div>
          </div>
        </div>
        <p v-if="!countsForBestTime(result)" class="hr-note">
          {{ BEST_TIME_MIN_CORRECT }}問以上正解するとタイムが記録されます
        </p>
        <p v-else-if="fasterWithMoreMisses" class="hr-note">
          ベストより速いけれど、ミスが多いので記録されません
        </p>
      </div>

      <ExpCard
        :exp-before="result.expBefore"
        :gained-exp="result.gainedExp"
        :delay="EXP_DELAY_MS"
      />

      <div class="grid-wrap">
        <HundredGridView :grid="result.grid" :inputs="result.inputs" :current-index="null" reveal />
      </div>
      <p v-if="!perfect" class="hr-note">赤いますは正しい答えを表示しています</p>

      <div class="hr-actions">
        <button class="btn-gem btn-gold" data-sound="start" @click="hundred.start()">
          <span class="btn-gold-gem">◆</span>
          <span class="btn-gold-label">TRY AGAIN</span>
          <span class="btn-gold-gem">◆</span>
        </button>
        <div class="hr-links">
          <button class="btn-ghost icon-btn" aria-label="ホームに戻る" @click="store.goHome()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 11.5 12 4.5l8.5 7M6 9.5V19.5h4.5v-5h3v5H18V9.5" />
            </svg>
          </button>
          <button class="btn-ghost icon-btn" aria-label="記録を見る" @click="hundred.openStats()">
            <!-- a bar chart -->
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h16M7.5 16.5v-4M12 16.5v-9M16.5 16.5v-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hr-root {
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding: max(1.5rem, env(safe-area-inset-top)) 1rem max(1.5rem, env(safe-area-inset-bottom));
}
.hr-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.hr-header {
  text-align: center;
}
.hr-icon {
  font-size: 2.2rem;
}
.hr-title {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hr-sub {
  color: var(--text-sub);
  font-size: 0.82rem;
  margin-top: 0.3rem;
  letter-spacing: 0.08em;
}
.new-best {
  display: inline-block;
  margin-top: 0.6rem;
  padding: 3px 12px;
  font-size: 0.8rem;
}
.hr-card {
  padding: 1rem;
}
.hr-time {
  text-align: center;
  font-size: 2.4rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--gold-light);
  margin-bottom: 0.7rem;
}
.hr-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.hr-tile {
  padding: 0.5rem 0;
}
.tile-label {
  font-size: 0.65rem;
  color: var(--text-sub);
  letter-spacing: 0.1em;
}
.tile-value {
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-main);
}
.tile-value small {
  font-size: 0.7rem;
  color: var(--text-sub);
}
.tile-value.miss {
  color: var(--danger-text);
}
.tile-value.best {
  color: var(--gold-light);
  font-size: 0.95rem;
  line-height: 1.6;
}
.tile-sub {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--danger-text);
  font-variant-numeric: tabular-nums;
}
.hr-note {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-sub);
  margin-top: 0.5rem;
}
.hr-card .hr-note {
  margin-bottom: -0.2rem;
}
.grid-wrap {
  width: 100%;
  aspect-ratio: 1;
  container-type: size;
}
.hr-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.hr-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.icon-btn {
  padding: 11px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
