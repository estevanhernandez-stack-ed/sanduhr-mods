import { expect, test } from 'claude-code/testing'

import { lineAt, lyricsUrl, parseLrc, trackKey } from './lyrics'
import { controlArgv, parseControl } from './watcher'

// Placeholder words, real LRC shape (stamps as LRCLIB serves them).
const LRC = ['[00:15.66] first line', '[00:17.19] second line', '[00:19.57]', '[00:21.00][01:21.00] chorus'].join('\n')

test('parses stamps, including several on one line, in time order', async () => {
  const lines = parseLrc(LRC)
  expect(lines.map(l => l.ms)).toEqual([15660, 17190, 19570, 21000, 81000])
  expect(lines[4].text).toBe('chorus')
})

test('the line being sung is the last stamp passed; a blank stamp is a pause', async () => {
  const lines = parseLrc(LRC)
  expect(lineAt(lines, 1000)).toBeNull()
  expect(lineAt(lines, 16000)).toBe('first line')
  expect(lineAt(lines, 18000)).toBe('second line')
  expect(lineAt(lines, 20000)).toBeNull()
  expect(lineAt(lines, 90000)).toBe('chorus')
})

test('lookup URL encodes names and sends whole seconds', async () => {
  const url = lyricsUrl('Alien Ant Farm', 'Smooth Criminal', 212295)
  expect(url).toBe('https://lrclib.net/api/get?artist_name=Alien%20Ant%20Farm&track_name=Smooth%20Criminal&duration=212')
  expect(trackKey('a', 'b')).not.toBe(trackKey('ab', ''))
})

test('control words map to player commands', async () => {
  expect(parseControl('')).toBe('toggle')
  expect(parseControl('Pause')).toBe('toggle')
  expect(parseControl('next')).toBe('next')
  expect(parseControl('back')).toBe('prev')
  expect(parseControl('louder')).toBeUndefined()
})

test('each control calls the matching media-session method', async () => {
  expect(controlArgv('toggle').at(-1)).toContain('TryTogglePlayPauseAsync')
  expect(controlArgv('next').at(-1)).toContain('TrySkipNextAsync')
  expect(controlArgv('prev').at(-1)).toContain('TrySkipPreviousAsync')
  expect(controlArgv('next').at(-1)).not.toContain('"')
})
