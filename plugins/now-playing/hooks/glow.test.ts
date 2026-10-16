import { expect, test } from 'claude-code/testing'

import { GLOW_PERIOD_MS, GLOW_RUN_MS, GLOW_WIDTH, applyGlow, brighten, glowAt, isGlowing, shade, shouldRepaint, sweepAt } from './glow'
import { currentLine, parseLrc } from './lyrics'

test('a sweep enters before the first character and is gone at the end', async () => {
  expect(sweepAt(0, 10)).toBe(-GLOW_WIDTH)
  expect(sweepAt(0.999, 10)).toBeGreaterThan(10)
  expect(sweepAt(1, 10)).toBeNull()
  expect(sweepAt(-0.1, 10)).toBeNull()
})

test('a shine in flight keeps frames fast between pulses', async () => {
  expect(shouldRepaint(2500, 2420)).toBe(false)
  expect(shouldRepaint(2500, 2420, 3000)).toBe(true)
})

test('shade deepens a color toward black for the control pill', async () => {
  expect(shade('#ff8040', 0)).toBe('#ff8040')
  expect(shade('#ff8040', 0.5)).toBe('#804020')
  expect(shade('#ffffff', 1)).toBe('#000000')
})

test('the current lyric line carries its start, so its shine can be timed', async () => {
  const lines = parseLrc('[00:10.00] one\n[00:20.00] two')
  expect(currentLine(lines, 21000)).toEqual({ ms: 20000, text: 'two' })
  expect(currentLine(lines, 5000)).toBeNull()
})

test('the pulse runs across the bar, then rests until the next period', async () => {
  expect(glowAt(0, 10)).toBe(-GLOW_WIDTH)
  expect(glowAt(GLOW_RUN_MS / 2, 10)).toBe((10 + GLOW_WIDTH * 2) / 2 - GLOW_WIDTH)
  expect(glowAt(GLOW_RUN_MS + 1, 10)).toBeNull()
  expect(glowAt(GLOW_PERIOD_MS + 10, 10)).not.toBeNull()
  expect(glowAt(10, 0)).toBeNull()
})

test('fast repaints only while a pulse runs; otherwise once a second', async () => {
  expect(shouldRepaint(500, 420)).toBe(true)
  expect(shouldRepaint(2500, 2420)).toBe(false)
  expect(shouldRepaint(3000, 2920)).toBe(true)
  expect(isGlowing(GLOW_RUN_MS + 100)).toBe(false)
})

test('brighten blends toward white and clamps', async () => {
  expect(brighten('#000000', 0)).toBe('#000000')
  expect(brighten('#000000', 1)).toBe('#ffffff')
  expect(brighten('#ff0000', 0.5)).toBe('#ff8080')
  expect(brighten('#123456', 5)).toBe('#ffffff')
})

test('only cells near the pulse light up, brightest at the center', async () => {
  const cells = Array.from({ length: 9 }, (_, i) => ({ ch: '━', color: '#400040', i }))
  const lit = applyGlow(cells, 4)
  expect(lit[4].color).not.toBe('#400040')
  expect(lit[0].color).toBe('#400040')
  expect(lit[8].color).toBe('#400040')
  expect(parseInt(lit[4].color.slice(1, 3), 16)).toBeGreaterThan(parseInt(lit[3].color.slice(1, 3), 16))
  expect(applyGlow(cells, null)).toEqual(cells)
})
