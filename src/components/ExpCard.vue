<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePreferencesStore } from '../stores/preferencesStore'
import { formatScore } from '../logic/format'
import { levelFromExp, levelRatio } from '../logic/level'
import { soundPlayer, expTickPitch } from '../logic/sound'
import LevelBar from './LevelBar.vue'

const props = defineProps<{
  /** EXP before this game */
  expBefore: number
  /** EXP this game earned */
  gainedExp: number
  /** wait in ms before the EXP starts pouring in, once the result's numbers have counted up */
  delay: number
}>()

const preferences = usePreferencesStore()

// The EXP pours into the level bar after `delay`.
// The bar fills, empties and fills again for every level gained on the way.
const { expBefore, gainedExp } = props
const expAfter = expBefore + gainedExp
const startLevel = levelFromExp(expBefore).level
const levelsGained = levelFromExp(expAfter).level - startLevel
const shownExp = ref(expBefore)
const shownLevel = computed(() => levelFromExp(shownExp.value))
/** levels gained so far on screen; the level-up flourish plays again each time it goes up */
const levelUps = computed(() => shownLevel.value.level - startLevel)
const EXP_FILL_MS = Math.min(900 + 450 * levelsGained, 3200)
let expTimer: ReturnType<typeof setTimeout> | null = null
let expFrame: number | null = null
/** Time between the blips that sound while the bar moves */
const EXP_TICK_INTERVAL_MS = 70

function fillExp() {
  const startedAt = performance.now()
  let lastTickAt = -Infinity
  const tick = (now: number) => {
    const progress = Math.min((now - startedAt) / EXP_FILL_MS, 1)
    // eases in and out, so each level-up along the way gets a moment of its own
    const eased = progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2
    const previous = shownExp.value
    const previousLevel = shownLevel.value.level
    shownExp.value = Math.round(expBefore + gainedExp * eased)
    if (preferences.soundEffects) {
      // a level-up chimes instead of the blip; otherwise the blip rises with the bar
      if (shownLevel.value.level > previousLevel) {
        soundPlayer.play('levelUp')
        lastTickAt = now
      } else if (shownExp.value !== previous && now - lastTickAt >= EXP_TICK_INTERVAL_MS) {
        soundPlayer.play('expTick', expTickPitch(levelRatio(shownLevel.value)))
        lastTickAt = now
      }
    }
    expFrame = progress < 1 ? requestAnimationFrame(tick) : null
  }
  expFrame = requestAnimationFrame(tick)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shownExp.value = expAfter
    return
  }
  expTimer = setTimeout(fillExp, props.delay)
})

onBeforeUnmount(() => {
  if (expTimer !== null) clearTimeout(expTimer)
  if (expFrame !== null) cancelAnimationFrame(expFrame)
})
</script>

<template>
  <!-- EXP earned and the level it leads to; it pops in a little before the EXP pours in -->
  <div class="exp-card rpg-card" :style="{ animationDelay: `${Math.max(delay - 250, 0)}ms` }">
    <div class="exp-head">
      <span class="exp-label">EXP</span>
      <span class="exp-gain">+{{ formatScore(gainedExp) }}</span>
      <span v-if="levelUps > 0" :key="levelUps" class="level-up">
        LEVEL UP!<template v-if="levelUps > 1"> ×{{ levelUps }}</template>
      </span>
    </div>
    <LevelBar :progress="shownLevel" :bump-key="levelUps" />
  </div>
</template>

<style scoped>
.exp-card {
  padding: 0.7rem 1rem 0.85rem;
  animation: exp-card-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
@keyframes exp-card-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.94);
  }
}
.exp-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.exp-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-sub);
  letter-spacing: 0.1em;
}
.exp-gain {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--gem-teal);
  font-variant-numeric: tabular-nums;
}
.level-up {
  margin-left: auto;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--gold-light);
  text-shadow: 0 0 12px rgba(var(--gold-light-rgb), 0.6);
  animation: level-up-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
:root[data-theme='light'] .level-up {
  text-shadow: none;
}
@keyframes level-up-pop {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.6);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px) scale(1.2);
  }
}
@media (prefers-reduced-motion: reduce) {
  .exp-card,
  .level-up {
    animation: none;
  }
}
</style>
