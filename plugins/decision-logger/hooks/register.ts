import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const logged = atom({ plugin: 'decision-logger', key: 'logged' } as const, 0)

// The claude.ai connector name is the live one; the local-server names stay for older setups.
export const DECISIONS_TOOL = /^mcp__(claude_ai_626Labs_Dash|626labs(-cloud)?)__manage_decisions$/
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
const EDITS_PER_NUDGE = 6

const STANDING_ORDER = [
  'Decision log, turned up. Este wants the 626 dashboard decision log fed generously, not sparingly.',
  'Log with manage_decisions (action: log), tagged with the bound project id, whenever the work crosses any fork:',
  'a choice of X over Y, a scope cut or add, a tradeoff, a gotcha discovered, a wall pushed through, a deadline or commitment.',
  'Lean toward logging when unsure. A short entry (what, why, what would revisit it) beats a missing one.',
  'Skip only the truly routine: ran tests, fixed a typo, renamed a variable.',
  'Log at the moment of the fork, in the same turn, without asking first.',
].join(' ')

export const register: Register = on => {
  let edits = 0
  let loggedThisTurn = false

  on('prompt.compose', async ($, e, next) => {
    const out = await next(e)

    return {
      sections: [...out.sections, { id: 'decision-logger:standing-order', text: STANDING_ORDER, scope: 'session' }],
    }
  })

  on('turn.start', ($, e, next) => {
    edits = 0
    loggedThisTurn = false

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (EDIT_TOOLS.has(e.tool)) {
      edits += 1

      return next(e)
    }

    if (DECISIONS_TOOL.test(e.tool)) {
      const ran = await next(e)
      const action = (e as { action?: unknown }).action

      if (ran.deny === undefined && ran.isError !== true && action === 'log') {
        loggedThisTurn = true
        const total = await update($, logged, n => n + 1)
        $.ui.toast(`Decision logged (${total} this session).`)
      }

      return ran
    }

    if (e.tool === 'Bash' && /\bgit\s+commit\b/.test(e.command)) {
      const ran = await next(e)

      if (ran.deny === undefined && ran.isError !== true) {
        $.ui.toast('Commit landed. Decision in it worth logging?')

        return {
          ...ran,
          context: [
            ...(ran.context ?? []),
            'A commit just landed. If it carried a decision, tradeoff, scope change or gotcha, log it with manage_decisions now, in this turn.',
          ],
        }
      }

      return ran
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (edits >= EDITS_PER_NUDGE && !loggedThisTurn) {
      const total = await read($, logged)
      $.ui.toast(`${edits} edits this turn, no decision logged (${total} so far).`, { timeoutMs: 6000 })
    }

    return next(e)
  })
}
