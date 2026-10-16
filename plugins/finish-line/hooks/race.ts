// The finish line's pure parts: which commands made a tag, and what the band draws at a moment.
// No $ here, so the tests read every frame without a stub.

/** How long the sprite runs to the line, and how long the finish stays after. */
export const RUN_MS = 2400
export const HOLD_MS = 3600
/** Narrower than this, the band folds to one line. */
export const FOLD_COLUMNS = 40

export const CLAUDE = '#d97757'
export const GOLD = '#f5c26b'
export const TRACK = '#6b6b78'

export type Run = { text: string; color?: string; bold?: boolean; dim?: boolean }
export type Line = Run[]

/** The tag a shell command created, or null: `git tag <name>` (with -a, -s, -m, -f), and
 * `gh release create <tag>`. Listing, deleting or verifying tags is no new tag. */
export function tagFrom(command: string): string | null {
  for (const words of commands(command)) {
    const git = words.indexOf('git')
    if (git >= 0 && words[git + 1] === 'tag') {
      const rest = words.slice(git + 2)
      if (rest.some(w => /^(-l|--list|-d|--delete|-v|--verify|--contains|--no-contains|--merged|--points-at|-n\d*)$/.test(w))) continue
      const name = firstName(rest, ['-m', '--message', '-F', '--file', '-u', '--local-user', '--cleanup'])
      if (name) return name
    }
    const gh = words.indexOf('gh')
    if (gh >= 0 && words[gh + 1] === 'release' && words[gh + 2] === 'create') {
      const name = firstName(words.slice(gh + 3), ['-t', '--title', '-n', '--notes', '-F', '--notes-file', '--target', '-R', '--repo', '--discussion-category'])
      if (name) return name
    }
  }
  return null
}

/** The tag the last turn made: a Bash call after the person's last prompt that didn't fail. */
export function tagOfTurn(messages: { role: string; text: string; toolUses: { tool: string; input: Record<string, unknown>; isError?: boolean }[] }[]): string | null {
  let from = 0
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].text.trim().length > 0) { from = i + 1; break }
  }
  let tag: string | null = null
  for (const m of messages.slice(from)) {
    for (const use of m.toolUses ?? []) {
      if (use.tool !== 'Bash' || use.isError === true || typeof use.input.command !== 'string') continue
      tag = tagFrom(use.input.command) ?? tag
    }
  }
  return tag
}

/** A command line as its commands' words: quotes kept together, split at && || ; and newlines. */
export function commands(line: string): string[][] {
  const out: string[][] = [[]]
  let word = ''
  let quote = ''
  let inWord = false
  const end = () => { if (inWord) out[out.length - 1].push(word); word = ''; inWord = false }
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quote) {
      if (c === quote) quote = ''
      else word += c
      continue
    }
    if (c === '"' || c === "'") { quote = c; inWord = true; continue }
    const two = line.slice(i, i + 2)
    if (two === '&&' || two === '||' || c === ';' || c === '\n') {
      end()
      out.push([])
      if (two === '&&' || two === '||') i++
      continue
    }
    if (/\s/.test(c)) { end(); continue }
    word += c
    inWord = true
  }
  end()
  return out.filter(ws => ws.length > 0)
}

/** The first word that isn't a flag or a flag's value. */
function firstName(words: string[], takesValue: string[]): string | null {
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (takesValue.includes(w)) { i++; continue }
    if (w.startsWith('-')) continue
    return w.length > 0 ? w.slice(0, 40) : null
  }
  return null
}

/** Where the run stands at `now`: 0 at the start, 1 at the line, then holding; null when over. */
export function progress(now: number, startedAt: number, motion: boolean): number | null {
  const t = now - startedAt
  if (t < 0 || t > RUN_MS + HOLD_MS) return null
  if (!motion) return 1
  const p = Math.min(1, t / RUN_MS)
  return 1 - (1 - p) * (1 - p)   // eases into the line
}

const SPRITE_TOP = ' ▐▛███▜▌ '
const SPRITE_MID = '▝▜█████▛▘'
const LEGS = ['  ▘▘ ▝▝  ', '  ▝▝ ▘▘  ']
const SPRITE_W = 9
const CONFETTI = ['✦', '·', '✧', '·', '✦']

/** The tag in a gradient from Claude's orange to gold, one color a letter. */
export function tagRuns(tag: string): Run[] {
  const letters = Array.from(tag)
  return letters.map((ch, i) => ({ text: ch, bold: true, color: mix(CLAUDE, GOLD, letters.length < 2 ? 0 : i / (letters.length - 1)) }))
}

export function mix(a: string, b: string, t: number): string {
  const ca = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16))
  const cb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** The band's lines for a run at progress `p` in `columns` cells, `now` choosing the stride. */
export function frame(tag: string, p: number, columns: number, now: number): Line[] {
  const finished = p >= 1
  const tagWidth = Array.from(tag).length
  // The finish row: the flag (2), then two spaces, the tag, two spaces and up to 9 of confetti.
  const line = Math.min(60, columns - 2 - (tagWidth + 13))
  if (columns < FOLD_COLUMNS || line < SPRITE_W + 4) {
    const track = Math.max(4, columns - Array.from(tag).length - 8)
    const x = Math.round(p * track)
    return [[
      { text: '·'.repeat(x), color: TRACK, dim: true },
      { text: '▐█▌', color: CLAUDE, bold: true },
      { text: '·'.repeat(Math.max(0, track - x)), color: TRACK, dim: true },
      { text: ' ▚ ', bold: true },
      ...(finished ? tagRuns(tag) : [{ text: tag, dim: true }]),
    ]]
  }
  const x = Math.round(p * (line - SPRITE_W + 2))
  const stride = Math.floor(now / 160) % 2
  const label: Run[] = finished
    ? [{ text: '  ' }, ...tagRuns(tag), { text: '  ' + CONFETTI.slice(0, 3 + stride).join(' '), color: GOLD }]
    : [{ text: '  ' + tag, dim: true }]
  const row = (sprite: string, ground: boolean, flag: string, tail: Run[]): Line => {
    const before = x
    const after = Math.max(0, line - x - SPRITE_W)
    const runs: Line = [
      { text: ground ? '·'.repeat(before) : ' '.repeat(before), color: TRACK, dim: true },
      { text: sprite, color: CLAUDE, bold: true },
      { text: ground ? '·'.repeat(after) : ' '.repeat(after), color: TRACK, dim: true },
      { text: flag, bold: true },
    ]
    return runs.concat(tail)
  }
  return [
    row(SPRITE_TOP, false, '▚▞', []),
    row(SPRITE_MID, false, '▞▚', label),
    row(finished ? LEGS[0] : LEGS[stride], true, '▚▞', []),
  ]
}
