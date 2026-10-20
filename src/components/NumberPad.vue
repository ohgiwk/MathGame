<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

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
/** while tracing, a key joins the stroke only once the finger is within this circle around its
    center, like a pattern lock's dots: a circle keeps well away from the corners, so a curving
    path between rows or columns does not pick up the keys beside it. It is sized to a fingertip,
    not the key, so taller keys leave wider margins between the circles. */
const TRACE_RADIUS_PX = 30
/** on small keys the circle shrinks to at most this share of the key's shorter side */
const TRACE_RADIUS_MAX_RATIO = 0.35

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

// Tracing: like a pattern lock, sliding from a digit onto other digits without lifting enters
// each of them in turn. The same digit twice in a row still needs a second tap.
interface Point {
  x: number
  y: number
}
let tracePointerId: number | null = null
let traceLastKey: HTMLButtonElement | null = null
const traceNodes = ref<Point[]>([])
const traceFinger = ref<Point | null>(null)
/** the whole path, ending at the finger once it has moved */
const tracePoints = computed(() => [
  ...traceNodes.value,
  ...(traceFinger.value ? [traceFinger.value] : []),
])

function keyCenter(key: HTMLElement): Point {
  const pad = padRef.value!.getBoundingClientRect()
  const r = key.getBoundingClientRect()
  return { x: r.left + r.width / 2 - pad.left, y: r.top + r.height / 2 - pad.top }
}

function digitKeyInsideAt(e: PointerEvent): HTMLButtonElement | null {
  if (!padRef.value) return null
  for (const key of padRef.value.querySelectorAll<HTMLButtonElement>('.pad-key:not(.pad-delete)')) {
    const r = key.getBoundingClientRect()
    const radius = Math.min(TRACE_RADIUS_PX, Math.min(r.width, r.height) * TRACE_RADIUS_MAX_RATIO)
    const distance = Math.hypot(
      e.clientX - (r.left + r.width / 2),
      e.clientY - (r.top + r.height / 2),
    )
    if (distance <= radius) return key
  }
  return null
}

function startTrace(e: PointerEvent, key: HTMLButtonElement) {
  tracePointerId = e.pointerId
  traceLastKey = key
  traceNodes.value = [keyCenter(key)]
  traceFinger.value = null
  // keep the moves coming to the pad wherever the finger goes; fails if the pointer is already gone
  try {
    padRef.value?.setPointerCapture(e.pointerId)
  } catch {
    endTrace()
  }
}

function endTrace() {
  tracePointerId = null
  traceLastKey = null
  traceNodes.value = []
  traceFinger.value = null
}

function handlePointerDown(e: PointerEvent) {
  pointerPressedKey = null
  endTrace()
  if (e.button !== 0) return
  const key = keyAt(e)
  if (!key || key.disabled) return
  pointerPressedKey = key
  press(key)
  if (key.dataset.key !== 'delete' && !props.disabled) startTrace(e, key)
}

function handlePointerMove(e: PointerEvent) {
  if (e.pointerId !== tracePointerId || !padRef.value) return
  const pad = padRef.value.getBoundingClientRect()
  traceFinger.value = { x: e.clientX - pad.left, y: e.clientY - pad.top }
  const key = digitKeyInsideAt(e)
  if (!key || key === traceLastKey || key.disabled) return
  traceLastKey = key
  traceNodes.value = [...traceNodes.value, keyCenter(key)]
  press(key)
}

function handlePointerEnd(e: PointerEvent) {
  if (e.pointerId === tracePointerId) endTrace()
}

// The answer is checked as soon as its last digit goes in, which disables the pad: the stroke stops there
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) endTrace()
  },
)

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
    @pointermove="handlePointerMove"
    @pointerup="handlePointerEnd"
    @pointercancel="handlePointerEnd"
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
    <svg v-if="traceNodes.length" class="trace" aria-hidden="true">
      <defs>
        <!-- sized to the pad, not the path: a straight line's box has no height and would blur away -->
        <filter
          id="trace-blur"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <!-- Lit like neon: a blurred halo, the colored line, and a white-hot core -->
      <g v-for="layer in ['halo', 'line', 'core']" :key="layer" :class="`trace-${layer}`">
        <polyline :points="tracePoints.map((p) => `${p.x},${p.y}`).join(' ')" />
        <circle v-for="(p, i) in traceNodes" :key="i" :cx="p.x" :cy="p.y" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* Edge to edge with no gaps: the keys tile the width, and 1px of the pad's background shows
   between them as hairlines */
.num-pad {
  flex-shrink: 0;
  /* tall enough that the keys come close to square: short rows put the circles of the keys above
     and below close to a path that crosses rows on a slant (4 to 9, 7 to 6) */
  height: clamp(220px, 50vh, 440px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 1px;
  background: var(--border);
  border-top: 1px solid var(--border);
  position: relative;
  /* the browser must not take a slide over the pad as a scroll, or tracing would be cut off */
  touch-action: none;
}
/* The traced path: lines from key to key, and on to the finger */
.trace {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  --trace-color: var(--gold-light);
}
/* the light theme's --gold-light is a dark ink brown; its spark gold reads as a bright stroke */
:root[data-theme='light'] .trace {
  --trace-color: var(--gold-spark);
}
.trace polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.trace-halo,
.trace-line {
  stroke: var(--trace-color);
  fill: var(--trace-color);
}
.trace-halo {
  filter: url(#trace-blur);
  stroke-width: 16;
  animation: trace-flicker 3s ease-in-out infinite;
}
.trace-line {
  stroke-width: 6;
}
.trace circle {
  stroke: none;
}
.trace-halo circle {
  r: 13px;
  animation: trace-flicker-dot 3s ease-in-out infinite;
}
.trace-line circle {
  r: 7px;
}
.trace-core circle {
  r: 3px;
}
.trace-core {
  stroke: #fff;
  fill: #fff;
  stroke-width: 2;
  opacity: 0.85;
}
/* The halo slowly swells and settles, like a calm flame */
@keyframes trace-flicker {
  0%,
  100% {
    stroke-width: 14;
    opacity: 0.85;
  }
  40% {
    stroke-width: 20;
    opacity: 1;
  }
  70% {
    stroke-width: 16;
    opacity: 0.9;
  }
}
@keyframes trace-flicker-dot {
  0%,
  100% {
    r: 12px;
  }
  40% {
    r: 15px;
  }
  70% {
    r: 13px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .trace-halo,
  .trace-halo circle {
    animation: none;
  }
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
  touch-action: none;
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
