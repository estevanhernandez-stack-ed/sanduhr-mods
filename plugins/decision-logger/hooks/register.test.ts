import { expect, test } from 'claude-code/testing'
import { DECISIONS_TOOL } from './register'

test('adds the standing order to the system prompt', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'base', text: 'base', scope: 'shared' }] }))

  const out = await $.prompt.compose({ model: 'm', promptModel: 'm', surfaces: [], tools: [], outputStyle: null, traits: [] })
  const ids = out.sections.map(s => s.id)

  expect(ids).toEqual(['base', 'decision-logger:standing-order'])
})

test('a successful git commit gets a decision reminder in context', async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '' } as never, text: 'ok' }))

  const ran = await $.tool.call({ tool: 'Bash', command: 'git commit -m "x"' })

  expect(ran.context?.join(' ')).toMatch(/manage_decisions/)
})

test('a plain command gets no reminder', async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '' } as never, text: 'ok' }))

  const ran = await $.tool.call({ tool: 'Bash', command: 'ls' })

  expect(ran.context).toBeUndefined()
})

test('recognises the connector and local-server decision tools', () => {
  expect(DECISIONS_TOOL.test('mcp__claude_ai_626Labs_Dash__manage_decisions')).toBe(true)
  expect(DECISIONS_TOOL.test('mcp__626labs__manage_decisions')).toBe(true)
  expect(DECISIONS_TOOL.test('mcp__626labs-cloud__manage_decisions')).toBe(true)
  expect(DECISIONS_TOOL.test('mcp__claude_ai_626Labs_Dash__manage_tasks')).toBe(false)
})
