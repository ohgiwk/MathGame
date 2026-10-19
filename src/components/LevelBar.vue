<script setup lang="ts">
import { computed } from 'vue'
import { type LevelProgress, levelRatio } from '../logic/level'
import { formatScore } from '../logic/format'

const props = defineProps<{
  progress: LevelProgress
  /** pulses the level number each time it goes up, e.g. after a level up; 0 leaves it still */
  bumpKey?: number
}>()

const percent = computed(() => `${levelRatio(props.progress) * 100}%`)
</script>

<template>
  <div class="level-bar">
    <div class="level-head">
      <span :key="bumpKey" class="level-name" :class="{ bump: bumpKey }">
        <span class="level-prefix">Lv.</span>{{ progress.level }}
      </span>
      <span class="level-next">
        <template v-if="progress.isMax">MAX</template>
        <template v-else>
          {{ formatScore(progress.expInLevel) }} / {{ formatScore(progress.expForLevel) }} EXP
        </template>
      </span>
    </div>
    <div
      class="level-track"
      role="progressbar"
      :aria-label="`レベル ${progress.level}`"
      aria-valuemin="0"
      :aria-valuemax="progress.isMax ? 1 : progress.expForLevel"
      :aria-valuenow="progress.isMax ? 1 : progress.expInLevel"
    >
      <div class="level-fill" :style="{ width: percent }"></div>
    </div>
  </div>
</template>

<style scoped>
.level-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 6px;
}
.level-name {
  display: inline-block;
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1.1;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
}
.level-name.bump {
  animation: level-bump 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes level-bump {
  40% {
    transform: scale(1.35);
  }
}
.level-prefix {
  font-size: 0.8rem;
  font-weight: 800;
  margin-right: 2px;
  color: var(--text-sub);
}
.level-next {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.level-track {
  height: 10px;
  border-radius: 99px;
  background: var(--bg-inset);
  border: 1px solid var(--border);
  overflow: hidden;
}
/* gold, apart from the blue-violet progress bar in a game, with a sheen along its top */
.level-fill {
  height: 100%;
  border-radius: inherit;
  background:
    linear-gradient(180deg, rgba(var(--gold-spark-rgb), 0.55), transparent 55%),
    linear-gradient(90deg, var(--gold-deep), var(--gold) 60%, var(--gold-light));
  box-shadow: 0 0 8px rgba(var(--gold-rgb), 0.5);
}
:root[data-theme='light'] .level-fill {
  background: linear-gradient(90deg, var(--gold-light), var(--gold) 60%, var(--gold-spark));
  box-shadow: none;
}
@media (prefers-reduced-motion: reduce) {
  .level-name.bump {
    animation: none;
  }
}
</style>
