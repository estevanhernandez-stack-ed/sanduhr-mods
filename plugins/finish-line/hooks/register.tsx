import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { RUN_MS, HOLD_MS, frame, progress, tagOfTurn } from './race'
import type { Race } from '../types'

const race = atom({ plugin: 'finish-line', key: 'race' } as const, null as Race | null)

/** The timer redrawing a run, one at a time (a reload drops it with the module). */
let ticking: { cancel: () => void } | null = null

/** A run starts: the band redraws every 80 ms while the sprite moves, then holds the finish. */
async function start($: any, tag: string, motion: boolean) {
  const startedAt = await $.clock.now()
  await update($, race, () => ({ tag, startedAt }))
  ticking?.cancel()
  ticking = $.clock.every(motion ? 80 : 1000, async () => {
    const now = await $.clock.now()
    if (now - startedAt > RUN_MS + HOLD_MS) {
      ticking?.cancel()
      ticking = null
      await update($, race, () => null)
      return
    }
    if (motion) $.ui.invalidate('ui.render')
  })
}

export const register: Register = (on, options) => {
  const motion = options.motion !== 'off'

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'finish-line',
      description: 'Replays the finish line, for a tag or the word you give.',
      argumentHint: '[tag]',
    })
    return next(e)
  })

  on('command.run', { command: 'finish-line' }, async ($, e) => {
    const tag = e.args.trim().slice(0, 40) || 'v1.0.0'
    await start($, tag, motion)
    return { text: `Across the line: ${tag}` }
  })

  // When a turn ends: a Bash command of that turn (since the person's last prompt) made a tag.
  // Read from the transcript, so nothing here can stop or change a command.
  on('turn.complete', async ($, e, next) => {
    const out = await next(e)
    const tag = tagOfTurn(await $.session.messages())
    if (tag) await start($, tag, motion)
    return out
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, race)
    if (r === null || e.props.hasSurvey || e.props.maxRows < 1) return next(e)
    const now = await $.clock.now()
    const p = progress(now, r.startedAt, motion)
    if (p === null) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const lines = frame(r.tag, p, e.props.bodyColumns, now).slice(0, e.props.maxRows)
    return (
      <Box flexDirection="column">
        {lines.map((line, i) => (
          <Box key={`l${i}`} flexDirection="row">
            {line.map((run, j) => (
              <Text key={`r${i}-${j}`} color={run.color} bold={run.bold} dimColor={run.dim} wrap="truncate-end">
                {run.text}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
