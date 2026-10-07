<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisterError(error: unknown) {
    console.error('SW registration error', error)
  },
})

function update() {
  updateServiceWorker(true)
}

function dismiss() {
  needRefresh.value = false
}
</script>

<template>
  <Transition name="pwa-toast">
    <div v-if="needRefresh" class="pwa-toast">
      <div class="pwa-content">
        <span class="pwa-gem">✦</span>
        <div class="pwa-text">
          <div class="pwa-title">アップデートあり</div>
          <div class="pwa-sub">新しいバージョンが利用可能です</div>
        </div>
      </div>
      <div class="pwa-actions">
        <button class="pwa-update-btn" @click="update">今すぐ更新</button>
        <button class="pwa-dismiss-btn" @click="dismiss">✕</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: calc(100% - 2rem);
  max-width: 420px;
  background: linear-gradient(135deg, #162040 0%, #1a2744 100%);
  border: 1px solid #3b5cf0;
  border-radius: 16px;
  padding: 1rem 1rem 1rem 1.1rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 16px rgba(59, 92, 240, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pwa-content {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 1;
  min-width: 0;
}

.pwa-gem {
  font-size: 1.4rem;
  color: #4c7cff;
  filter: drop-shadow(0 0 6px #4c7cff);
  flex-shrink: 0;
}

.pwa-text {
  min-width: 0;
}
.pwa-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: #d6e0f5;
  white-space: nowrap;
}
.pwa-sub {
  font-size: 0.72rem;
  color: #7a95bf;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pwa-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.pwa-update-btn {
  background: linear-gradient(135deg, #3b5cf0, #5b3cf0);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(76, 124, 255, 0.4);
  transition: transform 0.1s;
}
.pwa-update-btn:active {
  transform: scale(0.95);
}

.pwa-dismiss-btn {
  background: transparent;
  border: none;
  color: #7a95bf;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 6px;
  line-height: 1;
  transition: color 0.15s;
}
.pwa-dismiss-btn:hover {
  color: #d6e0f5;
}

.pwa-toast-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.pwa-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.pwa-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
.pwa-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
