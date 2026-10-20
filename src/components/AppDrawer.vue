<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import type { HomeMode } from '../types/game'
import { HOME_MODES, HOME_MODE_LABELS } from '../logic/labels'
import { usePreferencesStore } from '../stores/preferencesStore'
import CloseIcon from './CloseIcon.vue'

/** The menu that slides in from the left of home, to switch which game home sets up */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const preferences = usePreferencesStore()

const MODE_DESCRIPTIONS: Record<HomeMode, string> = {
  arithmetic: '足し算・引き算・掛け算・割り算',
  hundred: '10×10の100問をタイムアタック',
}

function select(mode: HomeMode) {
  preferences.homeMode = mode
  emit('close')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', handleKeydown)
    else window.removeEventListener('keydown', handleKeydown)
  },
)
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition name="drawer">
    <div v-if="open" class="drawer-overlay" @click.self="emit('close')">
      <nav class="drawer" role="dialog" aria-modal="true" aria-label="メニュー">
        <div class="drawer-header">
          <span class="drawer-title">MENU</span>
          <button class="drawer-close" aria-label="メニューを閉じる" @click="emit('close')">
            <CloseIcon />
          </button>
        </div>
        <h2 class="section-label"><span class="section-gem">◆</span> ゲーム</h2>
        <ul class="drawer-list">
          <li v-for="mode in HOME_MODES" :key="mode">
            <button
              class="drawer-item"
              :class="{ active: preferences.homeMode === mode }"
              :aria-current="preferences.homeMode === mode ? 'page' : undefined"
              @click="select(mode)"
            >
              <!-- four operator marks, or a small grid -->
              <svg v-if="mode === 'arithmetic'" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7 3.5v6M4 6.5h6M14 6.5h6M4.5 15l5 5M9.5 15l-5 5M14 17.5h6M17 14.6v.1M17 20.4v.1"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16" />
              </svg>
              <span class="item-text">
                <span class="item-name">{{ HOME_MODE_LABELS[mode] }}</span>
                <span class="item-desc">{{ MODE_DESCRIPTIONS[mode] }}</span>
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  /* covers the visible area to its bottom, past where the layout viewport may end (see main.css) */
  inset: 0 0 calc(100% - var(--app-height, 100%));
  z-index: 50;
  background: var(--overlay);
}
.drawer {
  width: min(78%, 300px);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
  background: linear-gradient(160deg, var(--bg-raised), var(--bg-raised2));
  border-right: 1px solid var(--border-gem);
  box-shadow: var(--shadow-raised);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  margin-bottom: 1.2rem;
}
.drawer-title {
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  color: var(--gold-light);
}
.drawer-close {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.drawer-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.drawer-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: transparent;
  color: var(--text-sub);
  text-align: left;
  cursor: pointer;
}
.drawer-item.active {
  border-color: var(--gold);
  color: var(--gold-light);
  background: linear-gradient(135deg, var(--bg-selected), var(--bg-selected2));
}
.drawer-item svg {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.item-name {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-main);
}
.drawer-item.active .item-name {
  color: var(--gold-light);
}
.item-desc {
  font-size: 0.65rem;
  opacity: 0.8;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.22s ease;
}
.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(-100%);
}
@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer,
  .drawer-leave-active .drawer {
    transition: none;
  }
}
</style>
