<script setup lang="ts">
import { ref } from 'vue'
import type { ActualOperation, Difficulty, FixedQuestionCount, Operation } from '../types/game'
import type { CourseSettings } from '../stores/courseStore'
import { COURSE_QUESTION_COUNTS } from '../logic/dailyCourses'
import {
  ACTUAL_OPERATIONS,
  DIFFICULTIES,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  MIN_MIXED_OPERATIONS,
  OPERATIONS,
  OPERATION_BUTTON_SYMBOLS,
  OPERATION_LABELS,
  isMixLocked,
  resolveMixedOperations,
  toggleMixedOperation,
} from '../logic/labels'

/** The form for one course: the same choices as the home screen, without endless */
const props = defineProps<{ initial: CourseSettings; title: string }>()

const emit = defineEmits<{
  cancel: []
  save: [settings: CourseSettings]
}>()

const count = ref<FixedQuestionCount>(props.initial.questionCount)
const difficulty = ref<Difficulty>(props.initial.difficulty)
const operation = ref<Operation>(props.initial.operation)
const mixed = ref<ActualOperation[]>(resolveMixedOperations(props.initial.mixedOperations))

function save() {
  emit('save', {
    questionCount: count.value,
    difficulty: difficulty.value,
    operation: operation.value,
    mixedOperations: mixed.value,
  })
}
</script>

<template>
  <div class="rpg-card editor">
    <h2 class="section-label"><span class="section-gem">◆</span> {{ title }}</h2>

    <div class="field-label">問題数</div>
    <div class="grid-4">
      <button
        v-for="c in COURSE_QUESTION_COUNTS"
        :key="c"
        class="opt-btn"
        :class="{ active: count === c }"
        :aria-pressed="count === c"
        @click="count = c"
      >
        <span class="opt-main">{{ c }}問</span>
      </button>
    </div>

    <div class="field-label">難易度</div>
    <div class="grid-3">
      <button
        v-for="d in DIFFICULTIES"
        :key="d"
        class="opt-btn"
        :class="{ active: difficulty === d }"
        :aria-pressed="difficulty === d"
        @click="difficulty = d"
      >
        <div class="opt-main">{{ DIFFICULTY_LABELS[d] }}</div>
        <div class="opt-sub">{{ DIFFICULTY_DESCRIPTIONS[d] }}</div>
      </button>
    </div>

    <div class="field-label">計算の種類</div>
    <div class="grid-5">
      <button
        v-for="op in OPERATIONS"
        :key="op"
        class="opt-btn"
        :class="{ active: operation === op }"
        :aria-pressed="operation === op"
        @click="operation = op"
      >
        <div class="opt-symbol">{{ OPERATION_BUTTON_SYMBOLS[op] }}</div>
        <div class="opt-sub">{{ OPERATION_LABELS[op] }}</div>
      </button>
    </div>
    <div v-if="operation === 'mixed'" class="mix-picker">
      <p class="mix-note">出題する計算（{{ MIN_MIXED_OPERATIONS }}つ以上）</p>
      <div class="grid-4">
        <button
          v-for="op in ACTUAL_OPERATIONS"
          :key="op"
          class="opt-btn mix-btn"
          :class="{ active: mixed.includes(op) }"
          :aria-pressed="mixed.includes(op)"
          :aria-disabled="isMixLocked(mixed, op)"
          :aria-label="OPERATION_LABELS[op]"
          @click="mixed = toggleMixedOperation(mixed, op)"
        >
          {{ OPERATION_BUTTON_SYMBOLS[op] }}
        </button>
      </div>
    </div>

    <div class="editor-actions">
      <button class="btn-ghost action-btn" @click="emit('cancel')">キャンセル</button>
      <button class="btn-gem btn-gold action-btn" @click="save">
        <span class="btn-gold-label">保存</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor {
  padding: 1rem 1.1rem;
}
.field-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-sub);
  letter-spacing: 0.1em;
  margin: 0.75rem 0 0.4rem;
}
.section-label + .field-label {
  margin-top: 0;
}
.grid-3,
.grid-4,
.grid-5 {
  display: grid;
  gap: 0.4rem;
}
.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}
.grid-5 {
  grid-template-columns: repeat(5, 1fr);
}
.grid-4 .opt-btn,
.grid-5 .opt-btn {
  padding: 10px 0;
}
.opt-main {
  font-size: 1rem;
  font-weight: 700;
}
.opt-sub {
  font-size: 0.7rem;
  opacity: 0.65;
  margin-top: 2px;
}
.grid-5 .opt-sub {
  font-size: 0.6rem;
  white-space: nowrap;
}
.opt-symbol {
  font-size: 1.3rem;
  font-weight: 800;
}
.mix-picker {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border);
}
.mix-note {
  font-size: 0.65rem;
  color: var(--text-sub);
  letter-spacing: 0.08em;
  margin-bottom: 0.4rem;
}
.mix-btn {
  padding: 7px 0;
  font-size: 1.05rem;
  font-weight: 800;
  opacity: 0.6;
}
.mix-btn.active {
  opacity: 1;
}
.editor-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 1rem;
}
.editor-actions .action-btn {
  padding: 12px;
  font-size: 0.95rem;
  justify-content: center;
}
</style>
