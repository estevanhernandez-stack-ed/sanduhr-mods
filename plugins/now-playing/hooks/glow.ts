// Light that sweeps across a run of colored characters: the bar's pulse, the title's
// shine when a song or its look lands, the lyric's shine when a new line starts.
// Pure helpers, no `$`.

export const GLOW_PERIOD_MS = 4000 // the bar pulses every 4s
export const GLOW_RUN_MS = 1100 // each bar pulse crosses in about a second
export const GLOW_WIDTH = 3 // how many characters the light spans
export const GLOW_FRAME_MS = 80 // repaint rate while any light is moving
export const TITLE_SHINE_MS = 1400 // one sweep across the title
export const LYRIC_SHINE_MS = 900 // one sweep across a new lyric line

// Where a sweep `fraction` (0 to 1) of the way through sits on `length` characters. It starts
// just before the first and ends just past the last, so the light enters and leaves softly.
export function sweepAt(fraction: number, length: number): number | null {
  if (fraction < 0 || fraction >= 1 || length <= 0) {
    return null
  }

  return fraction * (length + GLOW_WIDTH * 2) - GLOW_WIDTH
}

// The bar's pulse, or null between pulses.
export function glowAt(nowMs: number, length: number): number | null {
  return sweepAt((nowMs % GLOW_PERIOD_MS) / GLOW_RUN_MS, length)
}

export function isGlowing(nowMs: number): boolean {
  return nowMs % GLOW_PERIOD_MS < GLOW_RUN_MS
}

// Fast frames while any light moves (the bar's pulse, or a shine running until `fastUntil`),
// else only when the second changes, for the clock and the bar's length.
export function shouldRepaint(nowMs: number, lastMs: number, fastUntil = 0): boolean {
  return (
    isGlowing(nowMs) ||
    isGlowing(lastMs) ||
    nowMs < fastUntil ||
    lastMs < fastUntil ||
    Math.floor(nowMs / 1000) !== Math.floor(lastMs / 1000)
  )
}

const rgb = (h: string): number[] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const toHex = (c: number[]): string => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const clamp = (k: number): number => Math.min(1, Math.max(0, k))

// Blend toward white by k (0 to 1).
export function brighten(hex: string, k: number): string {
  return toHex(rgb(hex).map(v => v + (255 - v) * clamp(k)))
}

// Blend toward black by k (0 to 1): a deep tint of a color, for a background.
export function shade(hex: string, k: number): string {
  return toHex(rgb(hex).map(v => v * (1 - clamp(k))))
}

// Light the characters near `at`, brightest at its center.
export function applyGlow<T extends { color: string }>(cells: readonly T[], at: number | null, strength = 0.75): T[] {
  if (at === null) {
    return [...cells]
  }

  return cells.map((cell, i) => {
    const k = 1 - Math.abs(i - at) / GLOW_WIDTH

    return k > 0 ? { ...cell, color: brighten(cell.color, k * strength) } : cell
  })
}
