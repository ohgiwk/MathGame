import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

interface CountUpOptions {
  /** how long the count takes, in ms */
  duration?: number
  /** wait before the count starts, in ms */
  delay?: number
}

/** Counts from 0 up to `target` once the component is mounted, easing out toward the end. */
export function useCountUp(target: number, options: CountUpOptions = {}): Ref<number> {
  const { duration = 700, delay = 0 } = options
  const value = ref(0)

  let timer: ReturnType<typeof setTimeout> | null = null
  let frame: number | null = null

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      value.value = target
      return
    }

    timer = setTimeout(() => {
      const startedAt = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1)
        const eased = 1 - (1 - progress) ** 3
        value.value = Math.round(target * eased)
        frame = progress < 1 ? requestAnimationFrame(tick) : null
      }
      frame = requestAnimationFrame(tick)
    }, delay)
  })

  onBeforeUnmount(() => {
    if (timer !== null) clearTimeout(timer)
    if (frame !== null) cancelAnimationFrame(frame)
  })

  return value
}
