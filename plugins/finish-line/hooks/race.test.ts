import { expect, test } from 'claude-code/testing'

import { FOLD_COLUMNS, HOLD_MS, RUN_MS, frame, mix, progress, tagFrom, tagOfTurn, tagRuns } from './race'

test('a new tag starts a run; listing, deleting and verifying do not', async () => {
  expect(tagFrom('git tag v1.2.3')).toBe('v1.2.3')
  expect(tagFrom('git tag -a v2.0.0 -m "Two"')).toBe('v2.0.0')
  expect(tagFrom('git tag -m "release notes" -s v3.0.0')).toBe('v3.0.0')
  expect(tagFrom('npm test && git tag v4 && git push --tags')).toBe('v4')
  expect(tagFrom('gh release create v2.19.0-mac --title "Mac" --notes x')).toBe('v2.19.0-mac')
  expect(tagFrom('gh release create --draft v5')).toBe('v5')
  for (const none of ['git tag', 'git tag -l', 'git tag --list "v*"', 'git tag -d v1', 'git tag -v v1',
    'git tag --contains abc', 'git status', 'gh release list']) {
    expect(tagFrom(none)).toBe(null)
  }
})

test('the run eases to the line, holds, then ends', async () => {
  expect(progress(0, 0, true)).toBe(0)
  expect(progress(RUN_MS / 2, 0, true)).toBeGreaterThan(0.5)
  expect(progress(RUN_MS, 0, true)).toBe(1)
  expect(progress(RUN_MS + HOLD_MS - 1, 0, true)).toBe(1)
  expect(progress(RUN_MS + HOLD_MS + 1, 0, true)).toBe(null)
  // Motion off: the finish, still, from the start.
  expect(progress(0, 0, false)).toBe(1)
})

test('three rows wide, one row narrow, the tag lands at the finish', async () => {
  const text = (lines: { text: string }[][]) => lines.map(l => l.map(r => r.text).join(''))
  const running = text(frame('v1.2.3', 0.3, 100, 0))
  expect(running.length).toBe(3)
  expect(running[0]).toContain('▐▛███▜▌')
  expect(running[1]).toContain('v1.2.3')
  const done = frame('v1.2.3', 1, 100, 0)
  expect(text(done)[1]).toContain('✦')
  // The finish's tag is a gradient from Claude's orange to gold.
  const letters = done[1].filter(r => r.bold && r.color && r.text.length === 1 && 'v1.2.3'.includes(r.text))
  expect(letters[0].color).toBe('#d97757')
  expect(letters[letters.length - 1].color).toBe('#f5c26b')
  const narrow = text(frame('v1', 1, FOLD_COLUMNS - 1, 0))
  expect(narrow.length).toBe(1)
  expect(narrow[0]).toContain('▚')
  // Never wider than the band.
  for (const cols of [40, 64, 100, 200]) {
    for (const p of [0, 0.5, 1]) {
      for (const l of text(frame('v10.20.30-beta', p, cols, 0))) expect(Array.from(l).length).toBeLessThanOrEqual(cols)
    }
  }
})

test('colors mix per letter', async () => {
  expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  expect(tagRuns('a').map(r => r.color)).toEqual(['#d97757'])
})

test("only the last turn's tag counts, and not a failed command's", async () => {
  const bash = (command: string, isError = false) => ({ tool: 'Bash', input: { command }, isError })
  const turn = [
    { role: 'user', text: 'tag the old one', toolUses: [] },
    { role: 'assistant', text: '', toolUses: [bash('git tag v0.9')] },
    { role: 'user', text: 'now ship it', toolUses: [] },
    { role: 'assistant', text: '', toolUses: [bash('git tag v1.0', true), { tool: 'Read', input: { file_path: 'x' } }] },
    { role: 'user', text: '', toolUses: [] },
    { role: 'assistant', text: 'Tagged.', toolUses: [bash('git tag -a v1.0.1 -m done')] },
  ]
  expect(tagOfTurn(turn)).toBe('v1.0.1')
  expect(tagOfTurn(turn.slice(0, 3))).toBe(null)
  expect(tagOfTurn([])).toBe(null)
})
