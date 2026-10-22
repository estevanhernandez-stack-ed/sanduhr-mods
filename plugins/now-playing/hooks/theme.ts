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

// ---- The song key and the Sanduhr bridge -------------------------------------------------------
// One key for a song in every app: the same rule as Sanduhr's Core (`SongKey`). Sanduhr writes its
// look for the playing song to ~/.sanduhr/now-playing-look.json under this key, and reads the mod's
// picks back from now-playing-look-offer.json. Pure helpers, no `$`.

const REMASTER_MARK = / - remaster.*$| \(remaster[^)]*\)$/

// Lowercase each scalar on its own (U+0130 stays as written), collapse whitespace, drop one trailing remaster mark.
export function normalize(s: string): string {
  const lowered = [...s].map(c => (c === 'İ' ? c : c.toLowerCase())).join('')
  const collapsed = lowered.replace(/\s+/g, ' ').trim()

  return collapsed.replace(REMASTER_MARK, '').trim()
}

function utf8(text: string): number[] {
  const out: number[] = []

  for (const c of text) {
    const cp = c.codePointAt(0) as number

    if (cp < 0x80) {
      out.push(cp)
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
    } else if (cp < 0x10000) {
      // A lone surrogate becomes U+FFFD, as TextEncoder does.
      const unit = cp >= 0xd800 && cp <= 0xdfff ? 0xfffd : cp
      out.push(0xe0 | (unit >> 12), 0x80 | ((unit >> 6) & 0x3f), 0x80 | (unit & 0x3f))
    } else {
      out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
    }
  }

  return out
}

// FNV-1a 64-bit over the UTF-8 bytes of `text`, as 16 lowercase hex digits.
export function fnv1a64(text: string): string {
  let h = 0xcbf29ce484222325n

  for (const b of utf8(text)) {
    h = BigInt.asUintN(64, (h ^ BigInt(b)) * 0x100000001b3n)
  }

  return h.toString(16).padStart(16, '0')
}

// The song's key, or null when the title is empty once normalized (the artist may be empty).
export function songKey(title: string, artist: string): string | null {
  const t = normalize(title)

  return t === '' ? null : fnv1a64(`${t}\n${normalize(artist)}`)
}

// Sanduhr draws five letter styles. The mod's other fonts have no counterpart there.
export type SanduhrStyle = 'plain' | 'bold' | 'italic' | 'bolditalic' | 'smallcaps'

export const SANDUHR_STYLES: readonly SanduhrStyle[] = ['plain', 'bold', 'italic', 'bolditalic', 'smallcaps']

// Sanduhr's style as the mod's font: the five words are the mod's own, same spelling.
export function fontFromSanduhr(style: string): FontName | null {
  return (SANDUHR_STYLES as readonly string[]).includes(style) ? (style as FontName) : null
}

// The mod's font in Sanduhr's vocabulary; sans, mono, double, script and fraktur offer as plain.
export function sanduhrStyleOf(font: FontName): SanduhrStyle {
  return (SANDUHR_STYLES as readonly string[]).includes(font) ? (font as SanduhrStyle) : 'plain'
}

export type SanduhrLook = { key: string; theme: Theme; source: 'saved' | 'seeded' }

const HEX6 = /^#[0-9a-f]{6}$/i

// ~/.sanduhr/now-playing-look.json: `{schema_version:1,key,look:{ink,style,mood},source}`. Null for anything else.
export function parseSanduhrLook(text: string): SanduhrLook | null {
  try {
    const raw = JSON.parse(text) as { schema_version?: unknown; key?: unknown; source?: unknown; look?: { ink?: unknown; style?: unknown; mood?: unknown } }
    const look = raw.look

    if (raw.schema_version !== 1 || typeof raw.key !== 'string' || !/^[0-9a-f]{16}$/.test(raw.key) || (raw.source !== 'saved' && raw.source !== 'seeded')) {
      return null
    }

    if (look === null || typeof look !== 'object' || !Array.isArray(look.ink) || look.ink.length < 1 || look.ink.length > 4) {
      return null
    }

    if (!look.ink.every(c => typeof c === 'string' && HEX6.test(c)) || typeof look.style !== 'string') {
      return null
    }

    const font = fontFromSanduhr(look.style)

    if (font === null) {
      return null
    }

    const mood = typeof look.mood === 'string' ? look.mood.slice(0, 40) : ''

    return { key: raw.key, theme: { font, colors: (look.ink as string[]).map(c => c.toLowerCase()), mood }, source: raw.source }
  } catch {
    return null
  }
}

// ~/.sanduhr/now-playing-look-offer.json, the mod's pick for a song Sanduhr has no saved look for.
export function offerJson(key: string, title: string, artist: string, theme: Theme): string {
  return JSON.stringify({
    schema_version: 1,
    key,
    title,
    artist,
    look: { ink: theme.colors.slice(0, 4).map(c => c.toLowerCase()), style: sanduhrStyleOf(theme.font), mood: theme.mood.slice(0, 40) },
  })
}

// Where Sanduhr keeps its files for the mod, under the Windows profile folder. Null off Windows.
export function sanduhrFiles(profile: string | undefined): { dir: string; look: string; offer: string } | null {
  if (!profile) {
    return null
  }

  const dir = `${profile.replace(/[\\/]+$/, '')}\\.sanduhr`

  return { dir, look: `${dir}\\now-playing-look.json`, offer: `${dir}\\now-playing-look-offer.json` }
}
