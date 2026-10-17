import { expect, mock, test } from 'claude-code/testing'
import { parseAgentTools } from './register.js'

const HINT = { plugin: 'agent-comms', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false } } as const

test('a delivered SendMessage shows a waiting band until a peer replies', async ($, on) => {
  mock.clock(on, { now: 0 })
  on('ui.render', ($$, e) => {
    const { Box } = $$.ui.resolve(e)

    return <Box />
  })
  on('ui.toast', () => ({}) as never)
  on('session.send', () => ({ isDelivered: true }))
  on('session.receive', () => ({ consumed: 'no' }) as never)

  await $.session.send({ to: 'worker', text: 'status?' })

  const waiting = await $.ui.mount(HINT)
  expect(await waiting.find({ type: 'Text', text: /worker/ })).toBeDefined()

  await $.session.receive({ origin: { kind: 'peer' }, text: 'done' })

  const after = await $.ui.mount(HINT)
  await expect(after.findAll({ type: 'Text', text: /Waiting/ })).resolves.toEqual([])
})

test('a refused send leaves nothing waiting', async ($, on) => {
  mock.clock(on, { now: 0 })
  on('ui.render', ($$, e) => {
    const { Box } = $$.ui.resolve(e)

    return <Box />
  })
  on('session.send', () => ({ isDelivered: false, reason: 'nobody by that name' }))

  await $.session.send({ to: 'ghost', text: 'hello' })

  const band = await $.ui.mount(HINT)
  await expect(band.findAll({ type: 'Text', text: /Waiting/ })).resolves.toEqual([])
})

test('agentTools parses tool=Label pairs, defaulting a missing label to the tool name', () => {
  expect(parseAgentTools('mcp__a__ask=Fleet;  mcp__b__ping ; ;=x')).toEqual({ mcp__a__ask: 'Fleet', mcp__b__ping: 'mcp__b__ping' })
  expect(parseAgentTools(undefined)).toEqual({})
})
