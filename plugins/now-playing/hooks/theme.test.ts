import { expect, test } from 'claude-code/testing'

import { FONTS, PALETTES, defaultTheme, fnv1a64, fontFromSanduhr, gradient, normalize, offerJson, parseSanduhrLook, parseTheme, sanduhrFiles, sanduhrStyleOf, songKey, stylePrompt, styleText } from './theme'
import type { FontName } from './theme'

test('letter styles map letters and digits, and fill the Unicode holes', async () => {
  expect(styleText('Ab1', 'bold')).toBe('𝐀𝐛𝟏')
  expect(styleText('Ab1', 'mono')).toBe('𝙰𝚋𝟷')
  expect(styleText('CHR', 'double')).toBe('ℂℍℝ')
  expect(styleText('he', 'italic')).toBe('ℎ𝑒')
  expect(styleText('Smooth', 'smallcaps')).toBe('ꜱᴍᴏᴏᴛʜ')
  expect(styleText('a - b!', 'plain')).toBe('a - b!')
  expect(styleText('é ♪', 'bold')).toBe('é ♪')
})

test('every font keeps one glyph per letter', async () => {
  for (const font of FONTS) {
    expect([...styleText('Smooth Criminal 2001', font)].length).toBe(20)
  }
})

test('gradient runs from the first stop to the last', async () => {
  const g = gradient('abc', ['#000000', '#ffffff'])
  expect(g.map(c => c.color)).toEqual(['#000000', '#808080', '#ffffff'])
  expect(gradient('x', ['#ff0000', '#0000ff'])[0].color).toBe('#ff0000')
})

test('defaults are stable per song and always drawable', async () => {
  const a = defaultTheme('Alien Ant Farm\u0000Smooth Criminal')
  expect(defaultTheme('Alien Ant Farm\u0000Smooth Criminal')).toEqual(a)
  expect(FONTS).toContain(a.font)
  expect(PALETTES.map(p => p.name)).toContain(a.mood)
})

test('a model answer is accepted only when it is drawable', async () => {
  const good = 'Sure! {"font":"mono","colors":["#ff2a6d","#05d9e8","#d16ba5"],"mood":"slick nu-metal"}'
  expect(parseTheme(good)).toEqual({ font: 'mono', colors: ['#ff2a6d', '#05d9e8', '#d16ba5'], mood: 'slick nu-metal' })
  expect(parseTheme('{"font":"comic-sans","colors":["#ffffff","#000000"]}')).toBeNull()
  expect(parseTheme('{"font":"bold","colors":["red","#00ff00"]}')).toBeNull()
  expect(parseTheme('no json here')).toBeNull()
})

test('the prompt names the song and the allowed styles', async () => {
  const p = stylePrompt('Alien Ant Farm', 'Smooth Criminal')
  expect(p).toContain('Alien Ant Farm - Smooth Criminal')
  expect(p).toContain('fraktur')
})

// The vectors Sanduhr's Core pins (NowPlayingLook.cs); the key must match byte for byte.
test('raw FNV-1a 64 matches the reference vectors', async () => {
  expect(fnv1a64('')).toBe('cbf29ce484222325')
  expect(fnv1a64('a')).toBe('af63dc4c8601ec8c')
  expect(fnv1a64('foobar')).toBe('85944171f73967e8')
})

test('the song key matches Sanduhr on every shared vector', async () => {
  const vectors: [string, string, string][] = [
    ['Blinding Lights', 'The Weeknd', 'ad75f4c29077a9de'],
    ['  Blinding   Lights  ', 'THE WEEKND', 'ad75f4c29077a9de'],
    ['Song', 'Artist', 'd2a7aa06c42e57bd'],
    ['Song - Remastered 2011', 'Artist', 'd2a7aa06c42e57bd'],
    ['Song (Remastered 2009)', 'Artist', 'd2a7aa06c42e57bd'],
    ['Café del Mar', 'Energy 52', '245e2ded93cf9f31'],
    ['CAFÉ DEL MAR', 'energy 52', '245e2ded93cf9f31'],
    ['Untitled', '', '5f31c64688d31616'],
    ['Hey Jude - Remastered 2015', 'The Beatles', 'b0ccc496e92995e4'],
    ['Remaster Me', 'X', 'a31dfc67c5b9c43a'],
    ['A - Remastered', 'B', 'e5beb1190415e670'],
    ['x', 'y', 'be74b5197ee0cbea'],
  ]

  for (const [title, artist, key] of vectors) {
    expect(songKey(title, artist)).toBe(key)
  }
})

test('normalize: case per scalar, U+0130 kept, whitespace collapsed, one remaster mark dropped', async () => {
  expect(normalize('  Blinding\t\u00a0 Lights  ')).toBe('blinding lights')
  expect(normalize('\u0130stanbul')).toBe('\u0130stanbul')
  expect(normalize('Song - Remaster 2011 Mix')).toBe('song')
  expect(normalize('Song (Remastered 2009)')).toBe('song')
  expect(normalize('Song - Remastered - Remastered')).toBe('song')
  expect(normalize('Remaster Me')).toBe('remaster me')
})

test('a title that normalizes to nothing has no key; an empty artist is fine', async () => {
  expect(songKey('', 'X')).toBeNull()
  expect(songKey(' \u00a0 ', 'X')).toBeNull()
  expect(songKey('Untitled', '')).not.toBeNull()
})

test('Sanduhr styles map onto the mod fonts and the mod fonts back onto Sanduhr styles', async () => {
  for (const s of ['plain', 'bold', 'italic', 'bolditalic', 'smallcaps']) {
    expect(fontFromSanduhr(s)).toBe(s)
    expect(sanduhrStyleOf(s as FontName)).toBe(s)
  }

  expect(fontFromSanduhr('mono')).toBeNull()

  for (const f of ['sans', 'mono', 'double', 'script', 'fraktur'] as FontName[]) {
    expect(sanduhrStyleOf(f)).toBe('plain')
  }
})

const FILE = '{"schema_version":1,"key":"ad75f4c29077a9de","look":{"ink":["#FF2A6D","#05d9e8"],"style":"smallcaps","mood":"neon"},"source":"saved"}'

test('Sanduhr look file: parsed to a drawable theme, anything else refused', async () => {
  expect(parseSanduhrLook(FILE)).toEqual({
    key: 'ad75f4c29077a9de',
    theme: { font: 'smallcaps', colors: ['#ff2a6d', '#05d9e8'], mood: 'neon' },
    source: 'saved',
  })
  expect(parseSanduhrLook(FILE.replace('"saved"', '"seeded"'))?.source).toBe('seeded')
  expect(parseSanduhrLook(FILE.replace('"schema_version":1', '"schema_version":2'))).toBeNull()
  expect(parseSanduhrLook(FILE.replace('smallcaps', 'fraktur'))).toBeNull()
  expect(parseSanduhrLook(FILE.replace('"#05d9e8"', '"red"'))).toBeNull()
  expect(parseSanduhrLook(FILE.replace('["#FF2A6D","#05d9e8"]', '[]'))).toBeNull()
  expect(parseSanduhrLook(FILE.replace('["#FF2A6D","#05d9e8"]', '["#111111","#222222","#333333","#444444","#555555"]'))).toBeNull()
  expect(parseSanduhrLook(FILE.replace('ad75f4c29077a9de', 'AD75'))).toBeNull()
  expect(parseSanduhrLook('{"schema_version":1')).toBeNull()
  expect(parseSanduhrLook(FILE.replace(',"mood":"neon"', ''))?.theme.mood).toBe('')
})

test('the offer carries the mod pick in Sanduhr vocabulary, within the limits', async () => {
  const offer = JSON.parse(offerJson('ad75f4c29077a9de', 'Blinding Lights', 'The Weeknd', { font: 'mono', colors: ['#FF2A6D', '#05d9e8', '#d16ba5'], mood: 'x'.repeat(60) }))
  expect(offer).toEqual({
    schema_version: 1,
    key: 'ad75f4c29077a9de',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    look: { ink: ['#ff2a6d', '#05d9e8', '#d16ba5'], style: 'plain', mood: 'x'.repeat(40) },
  })
  expect(JSON.parse(offerJson('k', 't', 'a', { font: 'bolditalic', colors: ['#000000'], mood: '' })).look.style).toBe('bolditalic')
})

test('Sanduhr files sit under the profile folder; none without one', async () => {
  expect(sanduhrFiles('C:\\Users\\este\\')).toEqual({
    dir: 'C:\\Users\\este\\.sanduhr',
    look: 'C:\\Users\\este\\.sanduhr\\now-playing-look.json',
    offer: 'C:\\Users\\este\\.sanduhr\\now-playing-look-offer.json',
  })
  expect(sanduhrFiles(undefined)).toBeNull()
  expect(sanduhrFiles('')).toBeNull()
})
