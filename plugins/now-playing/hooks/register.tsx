import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { NowLyrics, NowTheme, NowTrack } from '../types'
import { GLOW_FRAME_MS, LYRIC_SHINE_MS, TITLE_SHINE_MS, applyGlow, glowAt, shouldRepaint, sweepAt } from './glow'
import { currentLine, lyricsUrl, parseLrc, trackKey } from './lyrics'
import { STYLE_SYSTEM, defaultTheme, gradient, hash, offerJson, parseSanduhrLook, parseTheme, sanduhrFiles, songKey, stylePrompt, styleText } from './theme'
import type { FontName, Theme } from './theme'
import { cleanTitle, clock, livePosition, parseLine } from './track'
import { WATCHER_ARGV, adapterIn, controlArgv, macControlArgv, macWatcherArgv, parseControl, sanduhrContents } from './watcher'
import type { Adapter, Control } from './watcher'

const current = atom({ plugin: 'now-playing', key: 'track' } as const, null as NowTrack | null)
const lyrics = atom({ plugin: 'now-playing', key: 'lyrics' } as const, null as NowLyrics | null)
const theme = atom({ plugin: 'now-playing', key: 'theme' } as const, null as NowTheme | null)
const controlsUntil = atom({ plugin: 'now-playing', key: 'controlsUntil' } as const, 0)
// When the title last started a shine: a new song, or the agent's look landing.
const shineAt = atom({ plugin: 'now-playing', key: 'shineAt' } as const, 0)

const SAID: Record<Control, string> = { toggle: 'Play/pause sent.', next: 'Skipped.', prev: 'Back one.' }
const CONTROLS_MS = 8000
const STYLE_MODEL = 'haiku'
const TITLE_MAX = 40
const BAR_WIDTH = 18
// Sanduhr writes its look for a song a moment after the track changes; give it this long before asking the model.
const SANDUHR_WAIT_MS = 1500
// The hover group: pointing anywhere on the now-playing line lights it and reveals the controls.
const HOVER = 'np-band'

// Where the track comes from, decided at session start: Windows' media session, a Mac (with
// Sanduhr's adapter when installed), or nothing.
type Player = { watch: readonly string[]; control: (action: Control) => string[] }
let player: Player | null = null
// Sanduhr's files for the mod (Windows only; the Mac app does not write them yet). Null elsewhere.
let sanduhr: ReturnType<typeof sanduhrFiles> = null
// The song key last offered to Sanduhr, so one song is offered once however many readings follow.
let offered: string | null = null

let ticker: { cancel: () => void } | null = null
let lastPaint = 0
// A drawing that starts a shine asks for fast frames until it ends.
let fastUntil = 0

// While playing: fast frames only while light moves (the bar's pulse, a title or lyric shine),
// else once a second for the clock and lyric. Nothing redraws while paused or silent.
function tick($: EngineInterface, track: NowTrack | null) {
  const isPlaying = track !== null && track.status === 'Playing'

  if (isPlaying && ticker === null) {
    ticker = $.clock.every(GLOW_FRAME_MS, () => {
      void $.clock.now().then(now => {
        if (shouldRepaint(now, lastPaint, fastUntil)) {
          lastPaint = now
          $.ui.invalidate('ui.render')
        }
      })
    })
  } else if (!isPlaying && ticker !== null) {
    ticker.cancel()
    ticker = null
  }
}

async function showControls($: EngineInterface) {
  const now = await $.clock.now()
  await update($, controlsUntil, () => now + CONTROLS_MS)
}

async function shine($: EngineInterface) {
  const now = await $.clock.now()
  await update($, shineAt, () => now)
}

// One lookup per song. Synced lyrics only: an unsynced line shown at the wrong time is worse than none.
async function fetchLyrics($: EngineInterface, track: NowTrack) {
  const key = trackKey(track.artist, track.title)
  await update($, lyrics, () => null)

  const res = await $.http.fetch(lyricsUrl(track.artist, cleanTitle(track.title), track.endMs), {
    headers: { 'User-Agent': 'now-playing (Claude Code mod)' },
  })

  if (!res.ok) {
    return
  }

  const body = JSON.parse(res.text) as { syncedLyrics?: string | null }

  if (!body.syncedLyrics) {
    return
  }

  // The song may have changed while the lookup was out.
  const playing = await read($, current)

  if (playing === null || trackKey(playing.artist, playing.title) !== key) {
    return
  }

  await update($, lyrics, () => ({ key, lines: parseLrc(body.syncedLyrics as string) }))
}

// Sanduhr's look for the song, when its file is there and names this song: the one it chose or seeded.
async function sanduhrLook($: EngineInterface, id: string | null) {
  if (sanduhr === null || id === null) {
    return null
  }

  try {
    const look = parseSanduhrLook(await $.fs.read(sanduhr.look))

    return look !== null && look.key === id ? look : null
  } catch {
    return null
  }
}

// Puts Sanduhr's look on the song if it is not there already; the title shines when it changes the look.
async function applySanduhr($: EngineInterface, key: string, id: string | null): Promise<boolean> {
  const look = await sanduhrLook($, id)
  const now = await read($, theme)

  if (look === null || now === null || now.key !== key) {
    return false
  }

  const same = now.source === 'sanduhr' && now.font === look.theme.font && now.colors.join() === look.theme.colors.join()

  if (!same) {
    await update($, theme, t => (t !== null && t.key === key ? { key, ...look.theme, source: 'sanduhr' } : t))
    await shine($)
  }

  return true
}

// The mod's own remembered pick: the song's key first, else the 32-bit entry older versions wrote (moved over once).
async function remembered($: EngineInterface, key: string, id: string | null) {
  const legacyKey = `theme:${hash(key)}`
  const storeKey = id === null ? legacyKey : `theme:${id}`
  const picked = parseTheme(JSON.stringify((await $.store.get(storeKey)) ?? ''))

  if (picked !== null || storeKey === legacyKey) {
    return picked
  }

  const old = parseTheme(JSON.stringify((await $.store.get(legacyKey)) ?? ''))

  if (old !== null) {
    await $.store.set(storeKey, old)
  }

  return old
}

// Hands the model's pick to Sanduhr as a proposal: only on Windows with Sanduhr's folder there, only when its current
// look for this song is not one it saved, and once per song. One write of the whole JSON; Sanduhr tolerates a partial file.
async function offerToSanduhr($: EngineInterface, track: NowTrack, id: string | null, picked: Theme) {
  if (sanduhr === null || id === null || offered === id || !(await $.fs.exists(sanduhr.dir).catch(() => false))) {
    return
  }

  if ((await sanduhrLook($, id))?.source === 'saved') {
    return
  }

  offered = id
  await $.fs.write(sanduhr.offer, offerJson(id, track.title, track.artist, picked))
}

// The look for a song: the default draws at once; Sanduhr's look, if it has one, replaces it with no model call;
// else a remembered pick; else the model's.
async function styleSong($: EngineInterface, track: NowTrack) {
  const key = trackKey(track.artist, track.title)
  const id = songKey(track.title, track.artist)
  await update($, theme, () => ({ key, ...defaultTheme(key), source: 'default' }))

  if (await applySanduhr($, key, id)) {
    return
  }

  // Sanduhr installed: its file may lag the track change by a moment, so wait before spending a model call.
  if (sanduhr !== null && id !== null && (await $.fs.exists(sanduhr.dir).catch(() => false))) {
    await $.clock.sleep(SANDUHR_WAIT_MS)

    const playing = await read($, current)

    if (playing === null || trackKey(playing.artist, playing.title) !== key || (await applySanduhr($, key, id))) {
      return
    }
  }

  const storeKey = id === null ? `theme:${hash(key)}` : `theme:${id}`
  const kept = await remembered($, key, id)

  if (kept !== null) {
    await update($, theme, t => (t !== null && t.key === key && t.source !== 'sanduhr' ? { key, ...kept, source: 'remembered' } : t))

    return
  }

  const answer = await $.model.complete({
    model: STYLE_MODEL,
    system: STYLE_SYSTEM,
    prompt: stylePrompt(track.artist, cleanTitle(track.title)),
    maxTokens: 200,
    effort: 'low',
    // Only bounds a hung call: the default is already on screen, and a late pick still lands mid-song.
    timeoutMs: 20000,
  })
  const picked = answer.isAnswered ? parseTheme(answer.text) : null

  if (picked === null) {
    return
  }

  await $.store.set(storeKey, picked)
  await offerToSanduhr($, track, id, picked).catch(() => undefined)

  // Only swap if the same song is still on (and Sanduhr has not set its own look), and shine the title so the change reads as a moment.
  const swapped = await update($, theme, t => (t !== null && t.key === key && t.source !== 'sanduhr' ? { key, ...picked, source: 'model' } : t))

  if (swapped?.source === 'model') {
    await shine($)
  }
}

// A file the module can read, or not. Reading a small known file is the engine's only way to look.
async function exists($: EngineInterface, path: string): Promise<boolean> {
  try {
    await $.fs.read(path)
    return true
  } catch {
    return false
  }
}

async function findPlayer($: EngineInterface): Promise<Player | null> {
  if ((await $.env.get('OS')) === 'Windows_NT') {
    return { watch: WATCHER_ARGV, control: controlArgv }
  }

  if (!(await exists($, '/System/Library/CoreServices/SystemVersion.plist'))) {
    return null
  }

  let adapter: Adapter | null = null

  for (const contents of sanduhrContents(await $.env.get('HOME'))) {
    if (await exists($, adapterIn(contents).script)) {
      adapter = adapterIn(contents)
      break
    }
  }

  return { watch: macWatcherArgv(adapter), control: action => macControlArgv(action, adapter) }
}

// One watcher process for the session's life. Leaving the loop (or unloading the module) kills it.
async function watch($: EngineInterface, argv: readonly string[]) {
  let buffer = ''
  let last = ''
  let song = ''

  for await (const chunk of $.process.spawn({ argv })) {
    if (chunk.stream !== 'stdout') {
      continue
    }

    buffer += chunk.text
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const track = parseLine(line.trim())
      const key = JSON.stringify(track)

      // Sanduhr may write or change its look at any moment of a song: look again on every reading.
      if (track !== null) {
        void applySanduhr($, trackKey(track.artist, track.title), songKey(track.title, track.artist)).catch(() => undefined)
      }

      if (key === last) {
        continue
      }

      last = key
      await update($, current, () => track)
      tick($, track)

      const nextSong = track === null ? '' : trackKey(track.artist, track.title)

      if (nextSong !== song) {
        song = nextSong

        if (track !== null) {
          await showControls($)
          await shine($)
          void fetchLyrics($, track).catch(() => undefined)
          void styleSong($, track).catch(() => undefined)
        }
      }
    }
  }
}

// Sends one command to the player. A toggle flips the band at once instead of waiting for the next read.
async function control($: EngineInterface, action: Control): Promise<string> {
  let said = ''
  await showControls($)

  if (player === null) {
    return 'Player controls need Windows or a Mac.'
  }

  try {
    said = (await $.process.run(player.control(action), { timeoutMs: 15000 })).stdout.trim()
  } catch {
    return 'The player controls could not start.'
  }

  if (said === 'none') {
    return 'Nothing is playing.'
  }

  if (said !== 'ok') {
    return 'The player refused that.'
  }

  if (action === 'toggle') {
    const now = await $.clock.now()
    const flipped = await update($, current, t =>
      t === null
        ? t
        : { ...t, posMs: livePosition(t, now), stampMs: now, status: t.status === 'Playing' ? 'Paused' : 'Playing' },
    )
    tick($, flipped)
  }

  return SAID[action]
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)

    await $.command.register({
      name: 'np',
      description: 'Control what is playing: /np (play/pause), /np next, /np prev',
      argumentHint: '[pause|next|prev]',
    })

    player = await findPlayer($)
    sanduhr = (await $.env.get('OS')) === 'Windows_NT' ? sanduhrFiles(await $.env.get('USERPROFILE')) : null

    if (player !== null) {
      // A reload or session end tears the loop down mid-read; that is the normal way it stops.
      void watch($, player.watch).catch(() => undefined)
    }

    return started
  })

  on('command.run', { command: 'np' }, async ($, e) => {
    const action = parseControl(e.args)

    if (action === undefined) {
      return { text: 'Use /np, /np next or /np prev.' }
    }

    return { text: await control($, action) }
  })

  // Shares the band: draws its own lines above whatever the plugins beneath draw.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const track = await read($, current)

    if (e.props.hasSurvey || track === null) {
      return below
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const key = trackKey(track.artist, track.title)
    const look = await read($, theme)
    const style = look !== null && look.key === key ? look : { ...defaultTheme(key), source: 'default' }
    const isPlaying = track.status === 'Playing'
    const pos = livePosition(track, now)

    const accent = style.colors[Math.floor(style.colors.length / 2)]
    // Asks the ticker for fast frames until a shine drawn here has finished.
    const keepFast = (ms: number) => {
      fastUntil = Math.max(fastUntil, now + ms)
    }

    // Title: the song's gradient in its letter style, and a sweep of light when the song or its look lands.
    const rawTitle = cleanTitle(track.title)
    const title = rawTitle.length > TITLE_MAX ? `${rawTitle.slice(0, TITLE_MAX - 1)}…` : rawTitle
    const titleCells = gradient(styleText(title, style.font as FontName), style.colors)
    const titleShine = now - (await read($, shineAt))
    const titleLit = titleShine < TITLE_SHINE_MS ? applyGlow(titleCells, sweepAt(titleShine / TITLE_SHINE_MS, titleCells.length), 0.85) : titleCells

    if (titleShine < TITLE_SHINE_MS) {
      keepFast(TITLE_SHINE_MS - titleShine)
    }

    // Bar: the filled run in the song's gradient, with a pulse of light flowing into the playhead.
    const filled = track.endMs > 0 ? Math.min(BAR_WIDTH - 1, Math.floor((pos / track.endMs) * BAR_WIDTH)) : -1
    const barCells = gradient('━'.repeat(Math.max(filled, 0)) + '●', style.colors)
    const barLit = isPlaying ? applyGlow(barCells, glowAt(now, barCells.length)) : barCells

    // Lyric: the line being sung, in the accent color, caught by a quick sweep as it starts.
    const words = await read($, lyrics)
    const line = words !== null && words.key === key ? currentLine(words.lines, pos) : null
    const lineAge = line === null ? Infinity : pos - line.ms
    const lyricCells = line === null ? [] : [...line.text].map(ch => ({ ch, color: accent }))
    const lyricLit = isPlaying && lineAge < LYRIC_SHINE_MS ? applyGlow(lyricCells, sweepAt(lineAge / LYRIC_SHINE_MS, lyricCells.length), 0.6) : lyricCells

    if (isPlaying && lineAge < LYRIC_SHINE_MS) {
      keepFast(LYRIC_SHINE_MS - lineAge)
    }

    // Controls show after a song change or a press, stay while paused (that is when you reach for
    // them), and come back whenever the pointer is anywhere on the now-playing line.
    const isShowingControls = !isPlaying || now < (await read($, controlsUntil))
    const glyphHover = { scope: HOVER, color: accent, bold: true } as const

    return (
      <Box flexDirection="column">
        <Box key="np-row" gap={1} hover={{ scope: HOVER }}>
          <Text color={accent}>{isPlaying ? '♪' : '❚❚'}</Text>
          {/* Paused, the line steps back to just the mark, bar, time and controls. */}
          {isPlaying && (
          <Box>
            {titleLit.map((c, i) => (
              <Text key={`t${i}`} color={c.color} bold>
                {c.ch}
              </Text>
            ))}
          </Box>
          )}
          {isPlaying && track.artist !== '' && <Text dimColor>· {track.artist}</Text>}
          {filled >= 0 && (
            <Box>
              {barLit.map((c, i) => (
                <Text key={`b${i}`} color={c.color}>
                  {c.ch}
                </Text>
              ))}
              <Text dimColor>{'─'.repeat(BAR_WIDTH - 1 - filled)}</Text>
            </Box>
          )}
          {track.endMs > 0 && (
            <Text dimColor>
              {clock(pos)} / {clock(track.endMs)}
            </Text>
          )}
          <Box
            key="np-controls"
            display={isShowingControls ? 'flex' : 'none'}
            hover={isShowingControls ? undefined : { scope: HOVER, display: 'flex' }}
            gap={1}
          >
            {/* Plain text words, no fill: the terminal draws the media icons as emoji tiles. */}
            <Button key="np-prev" label="prev" plain dimColor hover={glyphHover} onPress={() => control($, 'prev')} />
            <Text dimColor>·</Text>
            <Button key="np-toggle" label={isPlaying ? 'pause' : 'play'} plain hover={glyphHover} onPress={() => control($, 'toggle')} />
            <Text dimColor>·</Text>
            <Button key="np-next" label="next" plain dimColor hover={glyphHover} onPress={() => control($, 'next')} />
          </Box>
        </Box>
        {isPlaying && lyricLit.length > 0 && (
          <Box key="np-lyric" paddingLeft={2}>
            {lyricLit.map((c, i) => (
              <Text key={`l${i}`} color={c.color} italic>
                {c.ch}
              </Text>
            ))}
          </Box>
        )}
        {below}
      </Box>
    )
  })
}
