/** The greeting for the hour of the day (0–23): morning from 4, afternoon from 11, evening from 18 */
export function timeGreeting(hour: number): string {
  if (hour >= 4 && hour < 11) return 'おはよう！'
  if (hour >= 11 && hour < 18) return 'こんにちは！'
  return 'こんばんは！'
}

/**
 * The line under the greeting when the day's courses are shown at launch. `streak` is the days in
 * a row already cleared up to yesterday, `remaining` the courses still to clear today.
 */
export function courseGreetingMessage(streak: number, remaining: number, total: number): string {
  if (streak > 0) return `今日もクリアして ${streak + 1}日連続 をめざそう`
  if (remaining < total) return `のこり ${remaining}コース、がんばろう`
  return '今日のコースに挑戦しよう'
}
