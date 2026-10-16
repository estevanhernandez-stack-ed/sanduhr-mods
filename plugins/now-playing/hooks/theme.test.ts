import { expect, test } from 'claude-code/testing'

import { FONTS, PALETTES, defaultTheme, gradient, parseTheme, stylePrompt, styleText } from './theme'

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
