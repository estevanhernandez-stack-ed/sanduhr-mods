// Pure helpers for the now-playing band. No `$` in here.

export type Track = {
  app: string
  status: string
  artist: string
  title: string
  posMs: number
  endMs: number
  stampMs: number
}

// One JSON line from the watcher. `{}` or junk means nothing is playing.
export function parseLine(line: string): Track | null {
  try {
    const raw = JSON.parse(line) as Partial<Track>

    if (typeof raw.title !== 'string' || raw.title === '') {
      return null
    }

    return {
      app: String(raw.app ?? ''),
      status: String(raw.status ?? ''),
      artist: String(raw.artist ?? ''),
      title: raw.title,
      posMs: Number(raw.posMs) || 0,
      endMs: Number(raw.endMs) || 0,
      stampMs: Number(raw.stampMs) || 0,
    }
  } catch {
    return null
  }
}

// The player reports position at a moment, not continuously. While playing, add the time since.
export function livePosition(track: Track, nowMs: number): number {
  const drift = track.status === 'Playing' && track.stampMs > 0 ? Math.max(0, nowMs - track.stampMs) : 0
  const pos = track.posMs + drift

  return track.endMs > 0 ? Math.min(pos, track.endMs) : pos
}

export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function bar(posMs: number, endMs: number, width = 20): string {
  if (endMs <= 0) {
    return ''
  }

  const at = Math.min(width - 1, Math.floor((posMs / endMs) * width))

  return `${'━'.repeat(at)}●${'─'.repeat(width - 1 - at)}`
}

// YouTube titles carry noise the band doesn't need.
export function cleanTitle(title: string): string {
  return title
    .replace(/\s*[([](official|lyrics?|audio|video|music video|visualizer|hd|4k|remaster(ed)?)[^)\]]*[)\]]/gi, '')
    .trim()
}

export function bandLine(track: Track, nowMs: number): { label: string; meter: string } {
  const who = track.artist ? `${track.artist} - ` : ''
  const mark = track.status === 'Playing' ? '♪' : '❚❚'
  const pos = livePosition(track, nowMs)
  const meter = track.endMs > 0 ? `${bar(pos, track.endMs)}  ${clock(pos)} / ${clock(track.endMs)}` : ''

  return { label: `${mark} ${who}${cleanTitle(track.title)}`, meter }
}
