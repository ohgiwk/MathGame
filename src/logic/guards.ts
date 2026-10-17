/** Whether `value` is one of `options`, narrowing it to their type */
export function isOneOf<T>(options: readonly T[], value: unknown): value is T {
  return (options as readonly unknown[]).includes(value)
}
