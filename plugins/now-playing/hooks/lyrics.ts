// Synced lyrics from LRCLIB (lrclib.net): an open database, no key. Pure helpers, no `$`.

export type LyricLine = { ms: number; text: string }

const STAMP = /\[(\d+):(\d+(?:\.\d+)?)\]/g

// LRC: `[mm:ss.xx] text`. One line may carry several stamps (a repeated chorus).
export function parseLrc(lrc: string): LyricLine[] {
  const out: LyricLine[] = []

  for (const raw of lrc.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(STAMP)]
    const text = raw.replace(STAMP, '').trim()

    for (const m of stamps) {
      out.push({ ms: Math.round((Number(m[1]) * 60 + Number(m[2])) * 1000), text })
    }
  }

  return out.sort((a, b) => a.ms - b.ms)
}

// The line being sung at `posMs` with the time it started: the last one whose stamp has passed.
// Blank lines are pauses.
export function currentLine(lines: readonly LyricLine[], posMs: number): LyricLine | null {
  let hit: LyricLine | null = null

  for (const line of lines) {
    if (line.ms > posMs) {
      break
    }

    hit = line
  }

  return hit && hit.text !== '' ? hit : null
}

export function lineAt(lines: readonly LyricLine[], posMs: number): string | null {
  return currentLine(lines, posMs)?.text ?? null
}

export function lyricsUrl(artist: string, title: string, durationMs: number): string {
  const q = [
    `artist_name=${encodeURIComponent(artist)}`,
    `track_name=${encodeURIComponent(title)}`,
    durationMs > 0 ? `duration=${Math.round(durationMs / 1000)}` : '',
  ].filter(Boolean)

  return `https://lrclib.net/api/get?${q.join('&')}`
}

export function trackKey(artist: string, title: string): string {
  return `${artist}\u0000${title}`
}
