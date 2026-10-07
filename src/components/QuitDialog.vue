<script setup lang="ts">
defineProps<{ open: boolean }>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <Transition name="dialog">
    <div v-if="open" class="dialog-overlay" @click.self="emit('cancel')">
      <div class="dialog-box">
        <div class="dialog-icon">⚑</div>
        <h2 class="dialog-title">ゲームを中断しますか？</h2>
        <p class="dialog-sub">進行中の記録は失われます</p>
        <div class="dialog-actions">
          <button class="dialog-cancel" @click="emit('cancel')">続ける</button>
          <button class="dialog-confirm" @click="emit('confirm')">中断する</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.dialog-box {
  background: linear-gradient(145deg, #162040, #1a2744);
  border: 1px solid var(--border-gem);
  border-radius: 20px;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
  width: 100%;
  max-width: 320px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.7),
    0 0 24px rgba(59, 92, 240, 0.2);
}
.dialog-icon {
  font-size: 2.2rem;
  margin-bottom: 0.8rem;
  color: var(--gold);
  filter: drop-shadow(0 0 8px rgba(201, 168, 54, 0.4));
}
.dialog-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 0.4rem;
}
.dialog-sub {
  font-size: 0.78rem;
  color: var(--text-sub);
  margin-bottom: 1.5rem;
}
.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.dialog-cancel {
  background: transparent;
  border: 1px solid var(--border-gem);
  border-radius: 12px;
  color: var(--text-sub);
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.dialog-cancel:hover {
  border-color: var(--text-sub);
  color: var(--text-main);
}
.dialog-confirm {
  background: linear-gradient(135deg, #7b1a2a, #b02030);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(180, 30, 50, 0.4);
  transition: transform 0.1s;
}
.dialog-confirm:active {
  transform: scale(0.96);
}

.dialog-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.dialog-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dialog-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
