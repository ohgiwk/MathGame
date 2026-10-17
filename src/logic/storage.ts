// localStorage can be unavailable (private browsing, blocked site data) or full. These helpers
// never throw: a failed read finds nothing, and a failed write leaves the app working from memory
// for the rest of the session.

/** The parsed value saved under `key`; undefined when there is none or it cannot be read */
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable or full: the value lasts for this session only
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // storage unavailable: nothing was saved there to remove
  }
}
