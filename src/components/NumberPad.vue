<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  disabled: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  digit: [digit: string]
  delete: []
}>()

// in the order of a numeric keypad: 7 8 9 on top, 1 2 3 at the bottom
const DIGIT_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3']
/** how far outside a key a touch may land and still count for it; a little more than the gap */
const GAP_REACH_PX = 12

const padRef = ref<HTMLElement | null>(null)

// Restart the tap animation on every press so quick repeated taps each get feedback
function playTap(key: HTMLButtonElement) {
  key.classList.remove('tapped')
  void key.offsetWidth
  key.classList.add('tapped')
  navigator.vibrate?.(8)
}

function press(key: HTMLButtonElement | null | undefined) {
  if (!key || key.disabled) return
  playTap(key)
  const padKey = key.dataset.key
  if (padKey === 'delete') emit('delete')
  else if (padKey) emit('digit', padKey)
}

// A touch that lands in the gap between keys goes to the nearest key
function keyAt(e: PointerEvent): HTMLButtonElement | null {
  const direct = (e.target as HTMLElement).closest<HTMLButtonElement>('.pad-key')
  if (direct || !padRef.value) return direct

  let nearest: HTMLButtonElement | null = null
  let nearestDistance = GAP_REACH_PX
  for (const key of padRef.value.querySelectorAll<HTMLButtonElement>('.pad-key')) {
    const r = key.getBoundingClientRect()
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
    const distance = Math.hypot(dx, dy)
    if (distance <= nearestDistance) {
      nearest = key
      nearestDistance = distance
    }
  }
  return nearest
}

// Keys act on pointerdown, not click: a click is lost when the finger slides a little, when a
// second finger lands before the first lifts, or when the press ends outside the shrunken key.
let pointerPressedKey: HTMLButtonElement | null = null

function handlePointerDown(e: PointerEvent) {
  pointerPressedKey = null
  if (e.button !== 0) return
  const key = keyAt(e)
  if (!key || key.disabled) return
  pointerPressedKey = key
  press(key)
}

// Clicks that come without a pointer press (Enter/Space on a focused key, assistive tech) still work
function handleClick(e: MouseEvent) {
  const key = (e.target as HTMLElement).closest<HTMLButtonElement>('.pad-key')
  const alreadyHandled = key === pointerPressedKey
  pointerPressedKey = null
  if (!alreadyHandled) press(key)
}

function handleAnimationEnd(e: AnimationEvent) {
  const el = e.target as HTMLElement
  if (el.classList.contains('pad-key')) el.classList.remove('tapped')
}

// Physical keyboard: digits and Backspace behave like the on-screen keys
function handleKeydown(e: KeyboardEvent) {
  const padKey = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Backspace' ? 'delete' : null
  if (!padKey || props.disabled) return
  press(padRef.value?.querySelector<HTMLButtonElement>(`[data-key="${padKey}"]`))
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div
    ref="padRef"
    class="num-pad"
    @pointerdown="handlePointerDown"
    @click="handleClick"
    @animationend="handleAnimationEnd"
  >
    <button
      v-for="key in DIGIT_KEYS"
      :key="key"
      class="pad-key"
      :data-key="key"
      :disabled="disabled"
    >
      {{ key }}
    </button>
    <span class="pad-blank"></span>
    <button class="pad-key" data-key="0" :disabled="disabled">0</button>
    <button
      class="pad-key pad-delete"
      data-key="delete"
      :disabled="disabled || !canDelete"
      aria-label="1文字消す"
    >
      ⌫
    </button>
  </div>
</template>

<style scoped>
/* Edge to edge with no gaps: the keys tile the width, and 1px of the pad's background shows
   between them as hairlines */
.num-pad {
  flex-shrink: 0;
  height: clamp(220px, 42vh, 360px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 1px;
  background: var(--border);
  border-top: 1px solid var(--border);
}
.pad-key,
.pad-blank {
  background: var(--bg-card);
}
.pad-key {
  border: none;
  border-radius: 0;
  color: var(--text-main);
  font-size: 1.8rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: background 0.08s ease;
}
/* keys stay in place when pressed (scaling would open gaps in the grid); they light up instead */
.pad-key:active:not(:disabled) {
  filter: none;
  transform: none;
  background: var(--bg-pressed);
}
/* Tap feedback: the key flashes and fades back */
.pad-key.tapped {
  animation: pad-tap 0.32s ease-out;
}
@keyframes pad-tap {
  0% {
    background: var(--bg-flash);
    box-shadow: inset 0 0 0 2px var(--gem-blue);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pad-key.tapped {
    animation: none;
  }
}
.pad-key:disabled {
  color: var(--text-faint);
  cursor: default;
}
.pad-delete {
  color: var(--text-sub);
  font-size: 1.5rem;
}
</style>
