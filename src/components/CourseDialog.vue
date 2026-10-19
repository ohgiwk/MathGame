<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useCourseStore } from '../stores/courseStore'
import { courseMeta } from '../logic/dailyCourses'
import { operationLabel } from '../logic/labels'
import { timeGreeting, courseGreetingMessage } from '../logic/greeting'
import CloseIcon from './CloseIcon.vue'
import CourseCalendar from './CourseCalendar.vue'

/**
 * Today's daily courses, set for the player's level: tap one to play it; cleared ones are checked
 * until the date changes and new courses are set
 */
const store = useGameStore()
const courseStore = useCourseStore()

/** today's courses, or the calendar of days with all of them cleared */
const tab = ref<'courses' | 'calendar'>('courses')

// the checks belong to the day the list is opened on; once all are cleared it opens on the calendar
watch(
  () => store.courseDialogOpen,
  (open) => {
    if (!open) return
    courseStore.refreshDay()
    tab.value = courseStore.allClearedToday ? 'calendar' : 'courses'
  },
  { immediate: true },
)

const greeting = computed(() => timeGreeting(new Date().getHours()))
const greetingMessage = computed(() =>
  courseGreetingMessage(
    courseStore.streak,
    courseStore.courses.length - courseStore.clearedCount,
    courseStore.courses.length,
  ),
)

function close() {
  store.courseDialogOpen = false
  store.courseGreeting = false
}
</script>

<template>
  <!-- timed by the transitions alone, not by the launch animation still set on a closing dialog -->
  <Transition name="dialog" type="transition">
    <div
      v-if="store.courseDialogOpen"
      class="dialog-overlay"
      :class="{ launch: store.courseGreeting }"
      @click.self="close"
    >
      <div class="dialog-box" role="dialog" aria-labelledby="course-dialog-title">
        <button class="close-btn" aria-label="閉じる" @click="close"><CloseIcon /></button>
        <div v-if="store.courseGreeting" class="greeting">
          <p class="greeting-hello">{{ greeting }}</p>
          <p class="greeting-message">{{ greetingMessage }}</p>
        </div>
        <h2 id="course-dialog-title" class="dialog-title">毎日コース</h2>

        <div class="view-tabs dialog-tabs" role="tablist">
          <button
            role="tab"
            class="view-tab"
            :class="{ active: tab === 'courses' }"
            :aria-selected="tab === 'courses'"
            @click="tab = 'courses'"
          >
            コース
          </button>
          <button
            role="tab"
            class="view-tab"
            :class="{ active: tab === 'calendar' }"
            :aria-selected="tab === 'calendar'"
            @click="tab = 'calendar'"
          >
            カレンダー
          </button>
        </div>

        <CourseCalendar v-if="tab === 'calendar'" :completed-days="courseStore.completedDays" />
        <template v-else>
          <div class="streaks">
            <div class="tile streak-tile">
              <div class="streak-label">連続クリア</div>
              <div class="streak-value">
                {{ courseStore.streak }}<span class="streak-unit">日</span>
              </div>
            </div>
            <div class="tile streak-tile">
              <div class="streak-label">最高記録</div>
              <div class="streak-value best">
                {{ courseStore.bestStreak }}<span class="streak-unit">日</span>
              </div>
            </div>
          </div>

          <div class="today">
            <span
              >今日のコース<span class="today-level">Lv.{{ courseStore.level }} 向け</span></span
            >
            <span v-if="courseStore.allClearedToday" class="pill pill-success all-done"
              >全クリア！</span
            >
            <span v-else class="today-count"
              >{{ courseStore.clearedCount }} / {{ courseStore.courses.length }}</span
            >
          </div>
          <ul class="course-list">
            <li v-for="course in courseStore.courses" :key="course.id">
              <button
                class="course-item"
                :class="{ done: courseStore.isCleared(course.id) }"
                @click="store.startCourse(course)"
              >
                <span class="check" aria-hidden="true">
                  <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg>
                </span>
                <span class="course-text">
                  <span class="course-name">{{
                    operationLabel(course.operation, course.mixedOperations)
                  }}</span>
                  <span class="course-meta">{{ courseMeta(course) }}</span>
                </span>
                <span class="sr-only">{{
                  courseStore.isCleared(course.id) ? '（クリア済み）' : ''
                }}</span>
                <span class="play" aria-hidden="true">▶</span>
              </button>
            </li>
          </ul>
          <p class="auto-note">コースは毎日、レベルに合わせて自動で決まります</p>
        </template>
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
  padding: 1.5rem 1rem;
}
.dialog-box {
  position: relative;
  background: linear-gradient(145deg, var(--bg-raised), var(--bg-raised2));
  border: 1px solid var(--border-gem);
  border-radius: 20px;
  padding: 1.3rem 1.1rem 1.1rem;
  width: 100%;
  max-width: 360px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow:
    var(--shadow-raised),
    0 0 24px rgba(var(--blue-rgb), 0.2);
}
:root[data-theme='light'] .dialog-box {
  border-radius: 16px;
  box-shadow: var(--shadow-raised);
}
.close-btn {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.dialog-title {
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--gold-light);
  text-align: center;
  margin: 0.2rem 0 1rem;
}

.greeting {
  text-align: center;
  margin: 0.2rem 2rem 0.9rem;
  animation: greeting-in 0.5s ease-out 0.95s backwards;
}
.greeting-hello {
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--text-main);
}
.greeting-message {
  margin-top: 0.25rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-sub);
}
@keyframes greeting-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .greeting {
    animation: none;
  }
}

/* On launch: once home has started to appear, the backdrop fades in, the box rises with a little
   bounce, and then the greeting follows */
.dialog-overlay.launch {
  animation: launch-fade 0.4s ease 0.45s backwards;
}
.launch .dialog-box {
  animation: launch-rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s backwards;
}
@keyframes launch-fade {
  from {
    opacity: 0;
  }
}
@keyframes launch-rise {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.92);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dialog-overlay.launch,
  .launch .dialog-box {
    animation: none;
  }
}

.streaks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.streak-tile {
  padding: 0.6rem 0.4rem;
}
.streak-label {
  font-size: 0.65rem;
  color: var(--text-sub);
  letter-spacing: 0.08em;
}
.streak-value {
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1.2;
  color: var(--gold-light);
  font-variant-numeric: tabular-nums;
}
.streak-value.best {
  color: var(--text-main);
}
.streak-unit {
  font-size: 0.8rem;
  margin-left: 2px;
}

.dialog-tabs {
  margin-bottom: 0.9rem;
}

.today {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-sub);
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}
.today-level {
  margin-left: 0.5rem;
  color: var(--gold-light);
}
.today-count {
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}
.all-done {
  padding: 2px 10px;
  font-size: 0.7rem;
}

.course-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  overflow-y: auto;
  min-height: 0;
}
.course-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--border-gem);
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 0.88rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}
.course-item:active {
  transform: scale(0.97);
}
@media (hover: hover) {
  .course-item:hover {
    border-color: var(--gold);
  }
}
.check {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-gem);
  display: flex;
  align-items: center;
  justify-content: center;
}
.check svg {
  width: 14px;
  height: 14px;
  fill: none;
  /* the card color, so the check reads on the green in both themes */
  stroke: var(--bg-card);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  visibility: hidden;
}
.course-item.done .check {
  border-color: var(--success-text);
  background: var(--success-text);
}
.course-item.done .check svg {
  visibility: visible;
  animation: check-pop 0.35s ease;
}
.course-item.done .course-name {
  color: var(--text-sub);
}
.course-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.course-meta {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-sub);
}
.play {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: var(--gold);
}
@keyframes check-pop {
  0% {
    transform: scale(0.4);
  }
  70% {
    transform: scale(1.2);
  }
}
@media (prefers-reduced-motion: reduce) {
  .course-item.done .check svg {
    animation: none;
  }
}

.auto-note {
  margin-top: 0.8rem;
  font-size: 0.68rem;
  color: var(--text-sub);
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
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
