<script setup lang="ts">
import type { GameRecord } from '../types/game'
import { DIFFICULTY_LABELS, operationLabel, questionCountLabel } from '../logic/labels'
import { formatScore, formatElapsedTime } from '../logic/format'

defineProps<{
  record: GameRecord
  /** drops the line with the answers and time, for short lists */
  compact?: boolean
}>()
</script>

<template>
  <li class="history-row" :class="{ compact }">
    <div class="history-main">
      <div class="history-mode">
        {{ DIFFICULTY_LABELS[record.difficulty] }} ·
        {{ operationLabel(record.operation, record.mixedOperations) }} ·
        {{ questionCountLabel(record.questionCount) }}
      </div>
    </div>
    <div class="history-result">
      <div class="history-score">{{ formatScore(record.score) }}</div>
      <div v-if="!compact" class="history-time">
        {{ record.correctCount }} / {{ record.totalAnswered }} ·
        {{ formatElapsedTime(record.elapsedSeconds) }}
      </div>
    </div>
    <span
      class="history-badge pill"
      :class="
        record.questionCount === 'endless'
          ? 'pill-endless'
          : record.endReason === 'clear'
            ? 'pill-success'
            : 'pill-danger'
      "
    >
      {{
        record.questionCount === 'endless' ? '∞' : record.endReason === 'clear' ? 'クリア' : '失敗'
      }}
    </span>
  </li>
</template>

<style scoped>
.history-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(var(--wash-rgb), 0.06);
}
.history-row.compact {
  padding: 0.35rem 0;
}
.history-row:first-child {
  border-top: none;
  padding-top: 0;
}
.history-row:last-child {
  padding-bottom: 0;
}
.history-main {
  flex: 1;
  min-width: 0;
}
.history-mode {
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.compact .history-mode {
  font-size: 0.76rem;
}
.history-result {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.history-score {
  font-size: 1rem;
  font-weight: 900;
  color: var(--gold-light);
}
.compact .history-score {
  font-size: 0.9rem;
}
.history-time {
  font-size: 0.7rem;
  color: var(--text-sub);
  margin-top: 1px;
}
/* an endless game has no clear or failure; it just ends */
.pill-endless {
  --pill-rgb: var(--gold-rgb);
  color: var(--gold-light);
}
.history-badge {
  flex-shrink: 0;
  width: 3.4rem;
  text-align: center;
  font-size: 0.68rem;
  padding: 3px 0;
}
.compact .history-badge {
  width: 3rem;
  font-size: 0.62rem;
  padding: 2px 0;
}
</style>
