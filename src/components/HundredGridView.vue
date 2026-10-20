<script setup lang="ts">
import { computed } from 'vue'
import { OPERATOR_SYMBOLS } from '../logic/labels'
import { type HundredGrid, CELL_COUNT, cellAnswer, cellPosition } from '../logic/hundredGrid'

/** The 10 × 10 grid with its headers: the cells filled so far, and the one being answered */
const props = defineProps<{
  grid: HundredGrid
  inputs: readonly (string | null)[]
  /** the cell being answered; null once the grid is done */
  currentIndex: number | null
  /** what has been typed into the current cell so far */
  draft?: string
  /** after the game: a wrong cell shows the right answer */
  reveal?: boolean
}>()

const current = computed(() =>
  props.currentIndex === null ? null : cellPosition(props.currentIndex),
)

const cells = computed(() =>
  Array.from({ length: CELL_COUNT }, (_, i) => {
    const input = props.inputs[i]
    const answer = cellAnswer(props.grid, i)
    const wrong = input !== null && Number(input) !== answer
    let text = input ?? ''
    if (i === props.currentIndex) text = props.draft ?? ''
    else if (props.reveal && (wrong || input === null)) text = String(answer)
    return { text, wrong, current: i === props.currentIndex }
  }),
)
</script>

<template>
  <div class="hundred-grid" role="grid" aria-label="百ます">
    <div class="corner">{{ OPERATOR_SYMBOLS[grid.operation] }}</div>
    <div
      v-for="(n, c) in grid.columns"
      :key="`c${c}`"
      class="head"
      :class="{ lit: current?.column === c }"
    >
      {{ n }}
    </div>
    <template v-for="(n, r) in grid.rows" :key="`r${r}`">
      <div class="head" :class="{ lit: current?.row === r }">{{ n }}</div>
      <div
        v-for="(cell, c) in cells.slice(r * grid.columns.length, (r + 1) * grid.columns.length)"
        :key="c"
        class="cell"
        :class="{ current: cell.current, wrong: cell.wrong, revealed: reveal && cell.wrong }"
      >
        {{ cell.text }}
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Sized by its container: a square as large as the space it is given (see container-type) */
.hundred-grid {
  width: min(100cqw, 100cqh);
  aspect-ratio: 1;
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(11, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border-gem);
  border-radius: 8px;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
  font-size: min(3.6cqw, 3.6cqh);
  font-weight: 800;
}
.corner,
.head,
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}
.corner {
  background: var(--bg-selected);
  color: var(--gold-light);
  font-size: 1.2em;
}
.head {
  background: var(--bg-card2);
  color: var(--text-sub);
  transition:
    background 0.12s,
    color 0.12s;
}
.head.lit {
  background: var(--bg-selected);
  color: var(--gold-light);
}
.cell {
  background: var(--bg-card);
  color: var(--text-main);
}
.cell.current {
  background: var(--bg-flash);
  box-shadow: inset 0 0 0 2px var(--gold);
  color: var(--gold-light);
}
.cell.wrong {
  background: rgba(var(--ruby-rgb), 0.16);
  color: var(--danger-text);
}
/* after the game, a wrong cell shows the right answer, marked like a teacher's correction */
.cell.revealed {
  text-decoration: underline wavy rgba(var(--ruby-rgb), 0.7);
  text-underline-offset: 2px;
}
</style>
