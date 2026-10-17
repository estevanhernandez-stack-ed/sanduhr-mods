import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Pending } from '../types'

const pending = atom({ plugin: 'agent-comms', key: 'pending' } as const, [] as Pending[])

// MCP tools that hand a question to another agent, from the agentTools option: "tool=Label; tool=Label".
// The call is the wait.
export const parseAgentTools = (spec: unknown): Record<string, string> => {
  const tools: Record<string, string> = {}

  for (const entry of String(spec ?? '').split(';')) {
    const i = entry.indexOf('=')
    const tool = (i === -1 ? entry : entry.slice(0, i)).trim()

    if (tool !== '') {
      tools[tool] = (i === -1 ? '' : entry.slice(i + 1).trim()) || tool
    }
  }

  return tools
}

// A send nobody answers in this long stops being "waiting" and starts being stale.
const STALE_MS = 30 * 60 * 1000

const PEER_KINDS = new Set(['peer', 'peer-send-message', 'coordinator'])

const clock = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))

  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

let ticker: { cancel: () => void } | null = null

// The band counts seconds, so a timer redraws it once a second while anything waits.
function sync(list: Pending[], $: EngineInterface) {
  if (list.length > 0 && ticker === null) {
    ticker = $.clock.every(1000, () => $.ui.invalidate('ui.render'))
  } else if (list.length === 0 && ticker !== null) {
    ticker.cancel()
    ticker = null
  }
}

export const register: Register = (on, options) => {
  const AGENT_TOOLS = parseAgentTools(options.agentTools)
  let seq = 0

  on('tool.call', async ($, e, next) => {
    let label: string | undefined
    let kind: Pending['kind'] = 'tool'

    if (e.tool === 'Agent') {
      kind = 'agent'
      label = e.name ?? e.description
    } else if (AGENT_TOOLS[e.tool] !== undefined) {
      label = AGENT_TOOLS[e.tool]
    }

    if (label === undefined || e.agentId !== undefined) {
      return next(e)
    }

    const id = ++seq
    const at = await $.clock.now()
    sync(await update($, pending, list => [...list, { id, kind, label: label as string, at }]), $)

    try {
      return await next(e)
    } finally {
      sync(await update($, pending, list => list.filter(p => p.id !== id)), $)
    }
  })

  // SendMessage: delivered means queued, not read. The reply arrives as its own delivery.
  on('session.send', async ($, e, next) => {
    const sent = await next(e)

    if (sent.isDelivered && e.agentId === undefined) {
      const id = ++seq
      const at = await $.clock.now()
      sync(await update($, pending, list => [...list, { id, kind: 'send', label: e.to, at }]), $)
    }

    return sent
  })

  // A peer delivery answers the oldest open send. The delivery carries no sender, so this is FIFO.
  on('session.receive', async ($, e, next) => {
    if (PEER_KINDS.has(e.origin.kind)) {
      let who: string | undefined
      sync(
        await update($, pending, list => {
          const i = list.findIndex(p => p.kind === 'send')

          if (i === -1) {
            return list
          }

          who = list[i].label

          return list.filter((_, j) => j !== i)
        }),
        $,
      )
      $.ui.toast(who === undefined ? 'Reply came in.' : `Reply from ${who}.`)
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, pending)

    if (e.props.hasSurvey || list.length === 0) {
      return next(e)
    }

    const now = await $.clock.now()
    const live = list.filter(p => now - p.at < STALE_MS)

    if (live.length === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const parts = live.map(p => `${p.label} ${clock(now - p.at)}`)

    return (
      <Box>
        <Text color="yellow">Waiting on {live.length === 1 ? 'a reply' : `${live.length} replies`}: </Text>
        <Text dimColor>{parts.join('  |  ')}</Text>
      </Box>
    )
  })
}
