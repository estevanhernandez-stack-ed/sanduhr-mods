// Per-song look for the band: a Unicode letter style ("font") and a color gradient.
// Pure helpers, no `$`. The model picks; these defaults cover the gap until it answers.

export type FontName = 'plain' | 'bold' | 'italic' | 'bolditalic' | 'sans' | 'mono' | 'double' | 'script' | 'fraktur' | 'smallcaps'

export type Theme = { font: FontName; colors: string[]; mood: string }

export const FONTS: readonly FontName[] = ['plain', 'bold', 'italic', 'bolditalic', 'sans', 'mono', 'double', 'script', 'fraktur', 'smallcaps']

// Mathematical alphanumeric blocks: [upper A, lower a, digit 0 or 0 when the block has none].
const BLOCKS: Partial<Record<FontName, [number, number, number]>> = {
  bold: [0x1d400, 0x1d41a, 0x1d7ce],
  italic: [0x1d434, 0x1d44e, 0],
  bolditalic: [0x1d468, 0x1d482, 0],
  sans: [0x1d5d4, 0x1d5ee, 0x1d7ec],
  mono: [0x1d670, 0x1d68a, 0x1d7f6],
  double: [0x1d538, 0x1d552, 0x1d7d8],
  script: [0x1d49c, 0x1d4b6, 0],
  fraktur: [0x1d504, 0x1d51e, 0],
}

// Letters Unicode placed in the Letterlike block instead (the gaps in the ranges above).
const HOLES: Partial<Record<FontName, Record<string, string>>> = {
  italic: { h: 'ℎ' },
  double: { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' },
  script: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
  fraktur: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
}

const SMALL_CAPS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'

export function styleText(text: string, font: FontName): string {
  if (font === 'smallcaps') {
    return [...text].map(c => (/[a-z]/i.test(c) ? [...SMALL_CAPS][c.toLowerCase().charCodeAt(0) - 97] : c)).join('')
  }

  const block = BLOCKS[font]

  if (block === undefined) {
    return text
  }

  const holes = HOLES[font] ?? {}

  return [...text]
    .map(c => {
      if (holes[c] !== undefined) {
        return holes[c]
      }

      const code = c.charCodeAt(0)

      if (c >= 'A' && c <= 'Z') {
        return String.fromCodePoint(block[0] + code - 65)
      }

      if (c >= 'a' && c <= 'z') {
        return String.fromCodePoint(block[1] + code - 97)
      }

      if (c >= '0' && c <= '9' && block[2] !== 0) {
        return String.fromCodePoint(block[2] + code - 48)
      }

      return c
    })
    .join('')
}

const hex = (h: string): [number, number, number] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
const toHex = (rgb: number[]): string => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`

// One color per character, interpolated across the stops left to right.
export function gradient(text: string, colors: readonly string[]): { ch: string; color: string }[] {
  const chars = [...text]
  const stops = colors.map(hex)

  if (stops.length === 0) {
    return chars.map(ch => ({ ch, color: '#ffffff' }))
  }

  return chars.map((ch, i) => {
    const t = chars.length <= 1 ? 0 : (i / (chars.length - 1)) * (stops.length - 1)
    const lo = Math.min(Math.floor(t), stops.length - 1)
    const hi = Math.min(lo + 1, stops.length - 1)
    const f = t - lo

    return { ch, color: toHex(stops[lo].map((v, k) => v + (stops[hi][k] - v) * f)) }
  })
}

// Fun defaults, picked by a hash of the song so the same song always opens with the same look.
export const PALETTES: readonly { name: string; colors: string[] }[] = [
  { name: 'synthwave', colors: ['#ff2a6d', '#d16ba5', '#05d9e8'] },
  { name: 'sunset', colors: ['#ff7e5f', '#feb47b', '#ffd86f'] },
  { name: 'ocean', colors: ['#00c6ff', '#4f8bff', '#a18cff'] },
  { name: 'aurora', colors: ['#00f5a0', '#00d9f5', '#a06bff'] },
  { name: 'ember', colors: ['#f12711', '#f5af19', '#ffe259'] },
  { name: 'bubblegum', colors: ['#ff9a9e', '#f6a6d8', '#a18cd1'] },
  { name: 'toxic', colors: ['#b6ff00', '#00ff9c', '#00c3ff'] },
  { name: 'gold', colors: ['#f7971e', '#ffd200', '#fff6b7'] },
]

export function hash(s: string): number {
  let h = 0x811c9dc5

  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  }

  return h >>> 0
}

export function defaultTheme(songKey: string): Theme {
  const h = hash(songKey)
  const palette = PALETTES[h % PALETTES.length]
  const fonts: FontName[] = ['bold', 'sans', 'bolditalic', 'double', 'smallcaps', 'script']

  return { font: fonts[(h >>> 8) % fonts.length], colors: palette.colors, mood: palette.name }
}

export const STYLE_SYSTEM = 'You style a now-playing line in a dark terminal. Reply with one JSON object and nothing else.'

export function stylePrompt(artist: string, title: string): string {
  return [
    `Song: "${artist} - ${title}".`,
    `Pick a letter style from: ${FONTS.join(', ')}.`,
    'Pick 3 hex colors for a left-to-right gradient that fit the song: its mood, era and genre. All must read well on a dark background.',
    'Give a mood of at most 3 words.',
    'Reply exactly: {"font":"...","colors":["#rrggbb","#rrggbb","#rrggbb"],"mood":"..."}',
  ].join('\n')
}

// Accept only what the band can draw; anything else falls back to the default.
export function parseTheme(text: string): Theme | null {
  const match = text.match(/\{[\s\S]*\}/)

  if (match === null) {
    return null
  }

  try {
    const raw = JSON.parse(match[0]) as { font?: unknown; colors?: unknown; mood?: unknown }
    const colors = Array.isArray(raw.colors) ? raw.colors.filter(c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) : []

    if (!FONTS.includes(raw.font as FontName) || colors.length < 2) {
      return null
    }

    return { font: raw.font as FontName, colors: colors.slice(0, 4), mood: String(raw.mood ?? '').slice(0, 24) }
  } catch {
    return null
  }
}
