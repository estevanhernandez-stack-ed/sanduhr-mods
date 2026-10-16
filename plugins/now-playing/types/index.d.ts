export type NowTrack = {
  app: string
  status: string
  artist: string
  title: string
  posMs: number
  endMs: number
  stampMs: number
}

export type NowLyrics = {
  key: string
  lines: { ms: number; text: string }[]
}

export type NowTheme = {
  key: string
  font: string
  colors: string[]
  mood: string
  source: string
}

declare module 'claude-code' {
  interface PluginState {
    'now-playing': {
      track: NowTrack | null
      lyrics: NowLyrics | null
      theme: NowTheme | null
      controlsUntil: number
      shineAt: number
    }
  }
}
