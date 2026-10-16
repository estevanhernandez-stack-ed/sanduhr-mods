import { expect, test } from 'claude-code/testing'

import { bandLine, bar, cleanTitle, clock, livePosition, parseLine } from './track'

// Captured from the real watcher while YouTube Music played in Chrome.
const REAL =
  '{"app":"Chrome","status":"Playing","artist":"Alien Ant Farm","title":"Smooth Criminal (Official Music Video)","posMs":63152,"endMs":212295,"stampMs":1790999597272}'

test('parses a real watcher line, and treats {} or junk as silence', async () => {
  expect(parseLine(REAL)?.artist).toBe('Alien Ant Farm')
  expect(parseLine('{}')).toBeNull()
  expect(parseLine('not json')).toBeNull()
})

test('position moves while playing and holds while paused', async () => {
  const t = parseLine(REAL)!
  expect(livePosition(t, t.stampMs + 10000)).toBe(73152)
  expect(livePosition({ ...t, status: 'Paused' }, t.stampMs + 10000)).toBe(63152)
  expect(livePosition(t, t.stampMs + 10 * 60 * 1000)).toBe(212295)
})

test('clock and bar format', async () => {
  expect(clock(212295)).toBe('3:32')
  expect(clock(63152)).toBe('1:03')
  expect(bar(0, 1000, 10)).toBe('●─────────')
  expect(bar(1000, 1000, 10)).toBe('━━━━━━━━━●')
  expect(bar(5, 0)).toBe('')
})

test('YouTube noise comes off the title, the song stays', async () => {
  expect(cleanTitle('Smooth Criminal (Official Music Video)')).toBe('Smooth Criminal')
  expect(cleanTitle('Song [Lyrics]')).toBe('Song')
  expect(cleanTitle('Song (feat. Someone)')).toBe('Song (feat. Someone)')
})

test('band line: playing mark, artist, clean title, meter', async () => {
  const t = parseLine(REAL)!
  const line = bandLine(t, t.stampMs)
  expect(line.label).toBe('♪ Alien Ant Farm - Smooth Criminal')
  expect(line.meter).toContain('1:03 / 3:32')
  expect(bandLine({ ...t, status: 'Paused' }, t.stampMs).label.startsWith('❚❚')).toBe(true)
})
