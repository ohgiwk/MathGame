import type {
  ActualOperation,
  Course,
  Difficulty,
  FixedQuestionCount,
  Operation,
} from '../types/game'
import { ACTUAL_OPERATIONS, DIFFICULTIES, MIN_MIXED_OPERATIONS, OPERATIONS } from './labels'
import type { DayKey } from './dailyStats'
import { pick, seededRandom, type Random } from './seededRandom'

/** What the daily courses are drawn from once the player reaches `minLevel` */
export interface CourseTier {
  minLevel: number
  difficulties: Difficulty[]
  operations: Operation[]
  questionCounts: FixedQuestionCount[]
}

/** Lowest level first; each tier has at least four difficulty and operation pairs to draw from */
export const COURSE_TIERS: CourseTier[] = [
  {
    minLevel: 1,
    difficulties: ['easy'],
    operations: [...ACTUAL_OPERATIONS],
    questionCounts: [10],
  },
  { minLevel: 10, difficulties: ['easy'], operations: OPERATIONS, questionCounts: [10, 20] },
  {
    minLevel: 20,
    difficulties: ['easy', 'normal'],
    operations: OPERATIONS,
    questionCounts: [10, 20],
  },
  { minLevel: 35, difficulties: ['normal'], operations: OPERATIONS, questionCounts: [10, 20, 30] },
  {
    minLevel: 50,
    difficulties: ['normal', 'hard'],
    operations: OPERATIONS,
    questionCounts: [20, 30],
  },
  { minLevel: 75, difficulties: ['hard'], operations: OPERATIONS, questionCounts: [20, 30, 50] },
]

export const MIN_DAILY_COURSES = 2
export const MAX_DAILY_COURSES = 4

/** The tier for `level`: the highest one it has reached */
export function tierFor(level: number): CourseTier {
  return COURSE_TIERS.findLast((t) => level >= t.minLevel) ?? COURSE_TIERS[0]
}

/** `items` in a random order */
function shuffle<T>(items: readonly T[], random: Random): T[] {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

/** Two to four operations for a mix, in display order */
function drawMix(random: Random): ActualOperation[] {
  const size = MIN_MIXED_OPERATIONS + Math.floor(random() * (ACTUAL_OPERATIONS.length - 1))
  const chosen = shuffle(ACTUAL_OPERATIONS, random).slice(0, size)
  return ACTUAL_OPERATIONS.filter((op) => chosen.includes(op))
}

/**
 * The courses for `day` at `level`: two to four of them, each a different difficulty and
 * operation from the level's tier, listed from the easiest. The draw is seeded with the day and
 * the level, so the same day and level always give the same courses and the next day new ones.
 */
export function generateDailyCourses(level: number, day: DayKey): Course[] {
  const random = seededRandom(`${day}:${level}`)
  const tier = tierFor(level)
  const pairs = tier.difficulties.flatMap((difficulty) =>
    tier.operations.map((operation) => ({ difficulty, operation })),
  )
  const count =
    MIN_DAILY_COURSES + Math.floor(random() * (MAX_DAILY_COURSES - MIN_DAILY_COURSES + 1))
  return shuffle(pairs, random)
    .slice(0, count)
    .sort(
      (a, b) =>
        DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty) ||
        OPERATIONS.indexOf(a.operation) - OPERATIONS.indexOf(b.operation),
    )
    .map(({ difficulty, operation }, i) => ({
      id: `${day}-${i + 1}`,
      difficulty,
      operation,
      ...(operation === 'mixed' ? { mixedOperations: drawMix(random) } : {}),
      questionCount: pick(tier.questionCounts, random),
    }))
}
