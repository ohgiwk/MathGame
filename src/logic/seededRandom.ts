/** A random number generator: each call returns the next number in [0, 1) */
export type Random = () => number

/** Hashes a string into a 32-bit seed (FNV-1a) */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** A generator that gives the same sequence for the same seed (mulberry32) */
export function seededRandom(seed: string): Random {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One of `items`, drawn with `random` */
export function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)]
}
