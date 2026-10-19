<script setup lang="ts">
defineProps<{
  open: boolean
  icon: string
  title: string
  message: string
  cancelLabel: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <Transition name="dialog">
    <div v-if="open" class="dialog-overlay" @click.self="emit('cancel')">
      <div class="dialog-box">
        <div class="dialog-icon">{{ icon }}</div>
        <h2 class="dialog-title">{{ title }}</h2>
        <p class="dialog-sub">{{ message }}</p>
        <div class="dialog-actions">
          <button class="dialog-cancel" @click="emit('cancel')">{{ cancelLabel }}</button>
          <button class="dialog-confirm" @click="emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  /* covers the visible area to its bottom, past where the layout viewport may end (see main.css) */
  inset: 0 0 calc(100% - var(--app-height, 100%));
  z-index: 60;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.dialog-box {
  background: linear-gradient(145deg, var(--bg-raised), var(--bg-raised2));
  border: 1px solid var(--border-gem);
  border-radius: 20px;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
  width: 100%;
  max-width: 320px;
  box-shadow:
    var(--shadow-raised),
    0 0 24px rgba(var(--blue-rgb), 0.2);
}
:root[data-theme='light'] .dialog-box {
  border-radius: 16px;
  box-shadow: var(--shadow-raised);
}
:root[data-theme='light'] .dialog-icon {
  filter: none;
}
:root[data-theme='light'] .dialog-confirm {
  box-shadow: none;
}
.dialog-icon {
  font-size: 2.2rem;
  margin-bottom: 0.8rem;
  color: var(--gold);
  filter: drop-shadow(0 0 8px rgba(var(--gold-rgb), 0.4));
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
  background: linear-gradient(135deg, var(--danger), var(--danger2));
  border: none;
  border-radius: 12px;
  color: var(--text-on-accent);
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(var(--danger-rgb), 0.4);
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
