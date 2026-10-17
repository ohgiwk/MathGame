<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Course } from '../types/game'
import { useCourseStore, type CourseSettings } from '../stores/courseStore'
import { courseLabel, courseMeta } from '../logic/dailyCourses'
import { ACTUAL_OPERATIONS, operationLabel } from '../logic/labels'
import SubScreen from './SubScreen.vue'
import CourseEditor from './CourseEditor.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const courseStore = useCourseStore()

const NEW_COURSE: CourseSettings = {
  questionCount: 10,
  difficulty: 'normal',
  operation: 'addition',
  mixedOperations: [...ACTUAL_OPERATIONS],
}

/** the course being edited: its id, 'new' for one being added, or null while none is */
const editing = ref<string | null>(courseStore.courses.length === 0 ? 'new' : null)
const deleting = ref<Course | null>(null)

const deleteMessage = computed(() =>
  deleting.value ? `「${courseLabel(deleting.value)}」を削除します` : '',
)

function save(id: string, settings: CourseSettings) {
  if (id === 'new') courseStore.addCourse(settings)
  else courseStore.updateCourse(id, settings)
  editing.value = null
}

function confirmDelete() {
  if (deleting.value) courseStore.removeCourse(deleting.value.id)
  deleting.value = null
}
</script>

<template>
  <SubScreen title="Daily Courses">
    <p class="intro">
      毎日クリアしたいコースを登録しましょう。全コースをクリアした日が続くと、連続記録が伸びます。
    </p>

    <template v-for="(course, i) in courseStore.courses" :key="course.id">
      <CourseEditor
        v-if="editing === course.id"
        :initial="course"
        :title="`コース ${i + 1} を編集`"
        @cancel="editing = null"
        @save="save(course.id, $event)"
      />
      <div v-else class="rpg-card course-row">
        <span class="course-no">{{ i + 1 }}</span>
        <span class="course-text">
          <span class="course-name"
            >{{ operationLabel(course.operation, course.mixedOperations) }}
            <span v-if="courseStore.isCleared(course.id)" class="course-done">✓ 今日クリア</span>
          </span>
          <span class="course-meta">{{ courseMeta(course) }}</span>
        </span>
        <div class="row-actions">
          <button
            class="icon-btn"
            aria-label="上へ"
            :disabled="i === 0 || editing !== null"
            @click="courseStore.moveCourse(course.id, -1)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button
            class="icon-btn"
            aria-label="下へ"
            :disabled="i === courseStore.courses.length - 1 || editing !== null"
            @click="courseStore.moveCourse(course.id, 1)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button
            class="icon-btn"
            aria-label="編集"
            :disabled="editing !== null"
            @click="editing = course.id"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 19h3.5L18 9.5 14.5 6 5 15.5V19zM12.5 8l3.5 3.5" />
            </svg>
          </button>
          <button
            class="icon-btn danger"
            aria-label="削除"
            :disabled="editing !== null"
            @click="deleting = course"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <p v-if="courseStore.courses.length === 0 && editing !== 'new'" class="empty">
      まだコースがありません
    </p>

    <CourseEditor
      v-if="editing === 'new'"
      :initial="NEW_COURSE"
      title="新しいコース"
      @cancel="editing = null"
      @save="save('new', $event)"
    />
    <button v-else class="btn-ghost add-btn" :disabled="editing !== null" @click="editing = 'new'">
      ＋ コースを追加
    </button>

    <template #overlay>
      <ConfirmDialog
        :open="deleting !== null"
        icon="🗑"
        title="コースを削除しますか？"
        :message="deleteMessage"
        cancel-label="やめる"
        confirm-label="削除する"
        @cancel="deleting = null"
        @confirm="confirmDelete"
      />
    </template>
  </SubScreen>
</template>

<style scoped>
.intro {
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-sub);
  margin-bottom: 0.2rem;
}

.course-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.6rem 0.7rem 0.9rem;
}
.course-no {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: 1px solid rgba(var(--gold-rgb), 0.5);
  color: var(--gold-light);
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.course-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.course-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-main);
}
.course-meta {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-sub);
}
.course-done {
  margin-left: 0.3rem;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--success-text);
  white-space: nowrap;
}
.row-actions {
  flex-shrink: 0;
  display: flex;
  gap: 0.15rem;
}
.icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.icon-btn:active:not(:disabled) {
  background: rgba(var(--wash-rgb), 0.08);
  color: var(--text-main);
}
.icon-btn:disabled {
  opacity: 0.25;
  cursor: default;
}
.icon-btn.danger {
  color: var(--danger-text);
}
.icon-btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.empty {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-sub);
  padding: 1.2rem 0;
}
.add-btn {
  padding: 12px;
  font-size: 0.95rem;
}
.add-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
