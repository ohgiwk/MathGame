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

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const padRef = ref<HTMLElement | null>(null)

// Restart the tap animation on every press so quick repeated taps each get feedback
function playTap(key: HTMLButtonElement | null | undefined) {
  if (!key || key.disabled) return
  key.classList.remove('tapped')
  void key.offsetWidth
  key.classList.add('tapped')
  navigator.vibrate?.(8)
}

function handlePointerDown(e: PointerEvent) {
  playTap((e.target as HTMLElement).closest<HTMLButtonElement>('.pad-key'))
}

function handleAnimationEnd(e: AnimationEvent) {
  const el = e.target as HTMLElement
  if (el.classList.contains('pad-key')) el.classList.remove('tapped')
}

// Physical keyboard: digits and Backspace behave like the on-screen keys
function handleKeydown(e: KeyboardEvent) {
  const padKey = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Backspace' ? 'delete' : null
  if (!padKey || props.disabled) return
  playTap(padRef.value?.querySelector<HTMLButtonElement>(`[data-key="${padKey}"]`))
  if (padKey === 'delete') emit('delete')
  else emit('digit', padKey)
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div
    ref="padRef"
    class="num-pad"
    @pointerdown="handlePointerDown"
    @animationend="handleAnimationEnd"
  >
    <button
      v-for="key in DIGIT_KEYS"
      :key="key"
      class="pad-key"
      :data-key="key"
      :disabled="disabled"
      @click="emit('digit', key)"
    >
      {{ key }}
    </button>
    <span></span>
    <button class="pad-key" data-key="0" :disabled="disabled" @click="emit('digit', '0')">0</button>
    <button
      class="pad-key pad-delete"
      data-key="delete"
      :disabled="disabled || !canDelete"
      aria-label="1文字消す"
      @click="emit('delete')"
    >
      ⌫
    </button>
  </div>
</template>

<style scoped>
.num-pad {
  flex: 1;
  min-height: 0;
  max-height: 320px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 0.6rem;
}
.pad-key {
  background: var(--bg-card);
  border: 1px solid var(--border-gem);
  border-radius: 14px;
  color: var(--text-main);
  font-size: 1.7rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition:
    transform 0.08s ease,
    background 0.08s ease;
}
.pad-key:active:not(:disabled) {
  filter: none;
  transform: scale(0.95);
  background: #1c2b50;
  border-color: var(--gem-blue);
}
/* Tap feedback: the key dips and flashes */
.pad-key.tapped {
  animation: pad-tap 0.32s ease-out;
}
@keyframes pad-tap {
  0% {
    transform: scale(0.9);
    background: #24376a;
    border-color: var(--gem-blue);
    box-shadow:
      0 0 18px rgba(76, 124, 255, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  60% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pad-key.tapped {
    animation: none;
  }
}
.pad-key:disabled {
  opacity: 0.45;
  cursor: default;
}
.pad-delete {
  color: var(--text-sub);
  font-size: 1.4rem;
}

@media (max-height: 700px) {
  .num-pad {
    gap: 0.45rem;
  }
}
</style>
