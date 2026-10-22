import { expect, mock, test } from 'claude-code/testing'

import { defaultTheme, hash, sanduhrFiles, songKey, styleText } from './theme'
import type { FontName } from './theme'

const BAND = { plugin: 'now-playing', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 4 } } as never
const START = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const RUN = (args: string) => ({ command: 'np', args, origin: { kind: 'composer' }, presentation: 'text' }) as never
// Playing, 63s in at stamp 1000; the mocked clock reads 1000, so live position is 1:03.
const LINE = '{"app":"Chrome","status":"Playing","artist":"Alien Ant Farm","title":"Smooth Criminal (Official Music Video)","posMs":63152,"endMs":212295,"stampMs":1000}\n'
const LRC = '[00:15.66] placeholder one\n[01:00.00] placeholder sung now\n[01:10.00] placeholder later'
const SONG = 'Alien Ant Farm\u0000Smooth Criminal (Official Music Video)'
const MODEL_PICK = '{"font":"mono","colors":["#ff2a6d","#05d9e8","#d16ba5"],"mood":"slick"}'

type Opts = {
  isWindows: boolean
  lyricsStatus: number
  playerSays: string
  modelSays: string | null
  files?: string[]
  // Sanduhr's side: the profile folder, the folders that exist, the text of files (mutable, so a test can write one mid-song), and a model call counter.
  profile?: string
  dirs?: string[]
  texts?: Record<string, string>
  modelCalls?: { n: number }
  // More readings after the first, one every 2s of the mocked clock.
  later?: string[]
}

const MAC = '/System/Library/CoreServices/SystemVersion.plist'
const ADAPTER = '/Applications/Sanduhr.app/Contents/Resources/NowPlaying/mediaremote-adapter.pl'

function beneath(on: any, opts: Opts, argvs: string[][] = [], store: Record<string, unknown> = {}, spawned: string[][] = []) {
  const clock = mock.clock(on, { now: 1000 })
  // The store is a plain record the test can read back (mock.store only seeds one).
  on('store.get', (_$: unknown, e: { key: string }) => ({ value: store[e.key] }) as never)
  on('store.set', (_$: unknown, e: { key: string; value: unknown }) => {
    store[e.key] = e.value

    return { value: undefined } as never
  })
  on('session.start', (_$: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }) as never)
  on('env.get', (_$: unknown, e: { name: string }) => ({
    value: e.name === 'OS' && opts.isWindows ? 'Windows_NT' : e.name === 'HOME' ? '/Users/someone' : e.name === 'USERPROFILE' ? opts.profile : undefined,
  }) as never)
  on('fs.exists', (_$: unknown, e: { path: string }) => ({ value: (opts.dirs ?? []).includes(e.path) }) as never)
  on('fs.read', (_$: unknown, e: { path: string }) => {
    const text = opts.texts?.[e.path]

    if (text !== undefined) {
      return { value: text } as never
    }

    if (!(opts.files ?? []).includes(e.path)) {
      throw new Error(`no ${e.path}`)
    }

    return { value: '' } as never
  })
  on('ui.render', (_$: any, e: any) => {
    const { Text } = _$.ui.resolve(e)

    return <Text key="below">beneath</Text>
  })
  on('http.fetch', () => ({
    value: { status: opts.lyricsStatus, ok: opts.lyricsStatus === 200, headers: {}, text: JSON.stringify({ syncedLyrics: LRC }) },
  }) as never)
  on('model.complete', () => {
    if (opts.modelCalls !== undefined) {
      opts.modelCalls.n++
    }

    return {
    value:
      opts.modelSays === null
        ? { isAnswered: false, reason: 'timeout', usage: {} }
        : { isAnswered: true, text: opts.modelSays, usage: {} },
    } as never
  })
  on('process.spawn', async function* (_$: any, e: { argv: string[] }) {
    spawned.push(e.argv)
    yield { stream: 'stdout', text: LINE }

    for (const more of opts.later ?? []) {
      await clock.sleep(2000)
      yield { stream: 'stdout', text: more }
    }

    return { value: { code: 0, signal: null } }
  } as never)
  on('process.run', (_$: unknown, e: { argv: string[] }) => {
    argvs.push(e.argv)

    return { value: { exitCode: 0, stdout: `${opts.playerSays}\r\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } } as never
  })

  return clock
}

const settle = () => new Promise(resolve => setTimeout(resolve, 80))
const glyph = (font: string) => styleText('S', font as FontName)
const PLAYING = { isWindows: true, lyricsStatus: 200, playerSays: 'ok', modelSays: MODEL_PICK }

test('band: styled title, controls, the line being sung, and the band beneath', async ($, on) => {
  beneath(on, PLAYING)
  await $.session.start(START)
  await settle()

  const band = await $.ui.mount(BAND)
  await expect(band.findAll({ type: 'Text', text: /Alien Ant Farm/ })).resolves.toHaveLength(1)
  expect((await band.find({ key: 'np-lyric' }))?.text).toContain('placeholder sung now')
  await expect(band.findAll({ type: 'Button' })).resolves.toHaveLength(3)
  await expect(band.findAll({ type: 'Text', text: /beneath/ })).resolves.toHaveLength(1)
})

test('play/pause shows the action it will take: pause while playing', async ($, on) => {
  beneath(on, PLAYING)
  await $.session.start(START)
  await settle()

  const toggle = await (await $.ui.mount(BAND)).find({ key: 'np-toggle' })
  expect(toggle?.props.label).toBe('pause')
  expect(toggle?.props.plain).toBe(true)
})

test('the model pick replaces the default and is remembered for next time', async ($, on) => {
  const store: Record<string, unknown> = {}
  beneath(on, PLAYING, [], store)
  await $.session.start(START)
  await settle()

  const band = await $.ui.mount(BAND)
  await expect(band.findAll({ type: 'Text', text: glyph('mono') })).resolves.toHaveLength(1)
})

test('no answer in time: the fun default holds', async ($, on) => {
  beneath(on, { ...PLAYING, modelSays: null })
  await $.session.start(START)
  await settle()

  const fallback = defaultTheme(SONG).font
  const band = await $.ui.mount(BAND)
  await expect(band.findAll({ type: 'Text', text: glyph(fallback) })).resolves.toHaveLength(1)
})

test('controls hide a few seconds in, come back on hover, and stay out while paused', async ($, on) => {
  const clock = beneath(on, { ...PLAYING, lyricsStatus: 404 })
  const controls = async () => (await (await $.ui.mount(BAND)).find({ key: 'np-controls' }))?.props
  await $.session.start(START)
  await settle()

  expect((await controls())?.display).toBe('flex')

  await clock.advance(9000)
  const hidden = await controls()
  expect(hidden?.display).toBe('none')
  // The hover reveal is the surface's own and the kit does not hand `hover` back in props; the
  // engine validates it on every mount (it refuses a reveal on a Box that is already shown).
  expect(hidden?.backgroundColor).toBeUndefined()

  await $.command.run(RUN('pause'))
  await clock.advance(9000)
  expect((await controls())?.display).toBe('flex')
})

test('/np next sends the skip command; an unknown word gets the usage line', async ($, on) => {
  const argvs: string[][] = []
  beneath(on, { ...PLAYING, lyricsStatus: 404 }, argvs)
  await $.session.start(START)

  expect((await $.command.run(RUN('next'))).text).toBe('Skipped.')
  expect(argvs.at(-1)?.at(-1)).toContain('TrySkipNextAsync')
  expect((await $.command.run(RUN('louder'))).text).toContain('/np next')
})

test('/np when the player has no session', async ($, on) => {
  beneath(on, { ...PLAYING, playerSays: 'none' })
  await $.session.start(START)

  expect((await $.command.run(RUN(''))).text).toBe('Nothing is playing.')
})

test('off Windows and macOS nothing is spawned and the band is left alone', async ($, on) => {
  const spawned: string[][] = []
  beneath(on, { ...PLAYING, isWindows: false }, [], {}, spawned)
  await $.session.start(START)

  const band = await $.ui.mount(BAND)
  expect(spawned).toHaveLength(0)
  await expect(band.findAll({ type: 'Text', text: /Alien Ant Farm/ })).resolves.toHaveLength(0)
  await expect(band.findAll({ type: 'Text', text: /beneath/ })).resolves.toHaveLength(1)
  expect((await $.command.run(RUN('next'))).text).toBe('Player controls need Windows or a Mac.')
})

test('on a Mac with Sanduhr: its adapter under perl watches, and /np sends MediaRemote commands', async ($, on) => {
  const argvs: string[][] = []
  const spawned: string[][] = []
  beneath(on, { ...PLAYING, isWindows: false, lyricsStatus: 404, files: [MAC, ADAPTER] }, argvs, {}, spawned)
  await $.session.start(START)
  await settle()

  expect(spawned[0]?.[0]).toBe('/usr/bin/perl')
  expect(spawned[0]).toContain(ADAPTER)
  await expect((await $.ui.mount(BAND)).findAll({ type: 'Text', text: /Alien Ant Farm/ })).resolves.toHaveLength(1)
  expect((await $.command.run(RUN('next'))).text).toBe('Skipped.')
  expect(argvs.at(-1)?.at(-1)).toBe('4')
})

test('on a Mac without Sanduhr: Music and Spotify through osascript', async ($, on) => {
  const argvs: string[][] = []
  const spawned: string[][] = []
  beneath(on, { ...PLAYING, isWindows: false, lyricsStatus: 404, files: [MAC] }, argvs, {}, spawned)
  await $.session.start(START)
  await settle()

  expect(spawned[0]?.slice(0, 3)).toEqual(['/usr/bin/osascript', '-l', 'JavaScript'])
  expect((await $.command.run(RUN('prev'))).text).toBe('Back one.')
  expect(argvs.at(-1)?.at(-1)).toContain('previousTrack')
})

test('paused: title, artist and lyrics step back; mark, time and controls stay', async ($, on) => {
  beneath(on, PLAYING)
  await $.session.start(START)
  await settle()
  await $.command.run(RUN('pause'))

  const band = await $.ui.mount(BAND)
  await expect(band.findAll({ type: 'Text', text: /Alien Ant Farm/ })).resolves.toHaveLength(0)
  expect(await band.find({ key: 'np-lyric' })).toBeUndefined()
  await expect(band.findAll({ type: 'Text', text: /❚❚/ })).resolves.toHaveLength(1)
  expect((await band.find({ key: 'np-toggle' }))?.props.label).toBe('play')
})

// Sanduhr bridge: ~/.sanduhr/now-playing-look.json, keyed by the shared song key.
const PROFILE = 'C:\\Users\\este'
const SANDUHR = sanduhrFiles(PROFILE) as NonNullable<ReturnType<typeof sanduhrFiles>>
const LOOK_FILE = SANDUHR.look
const KEY = songKey('Smooth Criminal (Official Music Video)', 'Alien Ant Farm') as string
const sanduhrFile = (key: string, style: string, source = 'saved') =>
  JSON.stringify({ schema_version: 1, key, look: { ink: ['#ff2a6d', '#05d9e8'], style, mood: 'neon' }, source })

test('Sanduhr has a look for the song: it draws, and the model is never asked', async ($, on) => {
  const modelCalls = { n: 0 }
  beneath(on, { ...PLAYING, profile: PROFILE, dirs: [SANDUHR.dir], texts: { [LOOK_FILE]: sanduhrFile(KEY, 'italic') }, modelCalls })
  await $.session.start(START)
  await settle()

  const band = await $.ui.mount(BAND)
  await expect(band.findAll({ type: 'Text', text: glyph('italic') })).resolves.toHaveLength(1)
  expect(modelCalls.n).toBe(0)
})

test('Sanduhr writes its look a moment late: the wait catches it before any model call', async ($, on) => {
  const modelCalls = { n: 0 }
  const texts: Record<string, string> = { [LOOK_FILE]: sanduhrFile('0000000000000000', 'bold') }
  const clock = beneath(on, { ...PLAYING, profile: PROFILE, dirs: [SANDUHR.dir], texts, modelCalls })
  await $.session.start(START)
  await settle()

  // The file still names the previous song, so the default holds and the model waits.
  expect(modelCalls.n).toBe(0)
  texts[LOOK_FILE] = sanduhrFile(KEY, 'smallcaps')
  await clock.advance(2000)
  await settle()

  const band = await $.ui.mount(BAND)
  await expect(band.findAll({ type: 'Text', text: glyph('smallcaps') })).resolves.toHaveLength(1)
  expect(modelCalls.n).toBe(0)
})

test('Sanduhr installed but with no look for the song: the model picks after the wait', async ($, on) => {
  const modelCalls = { n: 0 }
  const clock = beneath(on, { ...PLAYING, profile: PROFILE, dirs: [SANDUHR.dir], modelCalls })
  await $.session.start(START)
  await settle()
  expect(modelCalls.n).toBe(0)

  await clock.advance(2000)
  await settle()

  expect(modelCalls.n).toBe(1)
  await expect((await $.ui.mount(BAND)).findAll({ type: 'Text', text: glyph('mono') })).resolves.toHaveLength(1)
})

test('Sanduhr changes its look mid-song: the band follows on the next reading', async ($, on) => {
  const texts: Record<string, string> = {}
  const later = [LINE.replace('63152', '65152')]
  const clock = beneath(on, { ...PLAYING, profile: PROFILE, dirs: [SANDUHR.dir], texts, later })
  await $.session.start(START)
  await settle()
  await clock.advance(1500)
  await settle()
  await expect((await $.ui.mount(BAND)).findAll({ type: 'Text', text: glyph('mono') })).resolves.toHaveLength(1)

  texts[LOOK_FILE] = sanduhrFile(KEY, 'bolditalic')
  await clock.advance(500)
  await settle()

  await expect((await $.ui.mount(BAND)).findAll({ type: 'Text', text: glyph('bolditalic') })).resolves.toHaveLength(1)
})

test('a pick remembered under the old 32-bit key is found and moved to the song key', async ($, on) => {
  const modelCalls = { n: 0 }
  const store: Record<string, unknown> = { [`theme:${hash(SONG)}`]: { font: 'script', colors: ['#ff2a6d', '#05d9e8'], mood: 'old' } }
  beneath(on, { ...PLAYING, modelCalls }, [], store)
  await $.session.start(START)
  await settle()

  expect(modelCalls.n).toBe(0)
  expect(store[`theme:${KEY}`]).toEqual({ font: 'script', colors: ['#ff2a6d', '#05d9e8'], mood: 'old' })
  await expect((await $.ui.mount(BAND)).findAll({ type: 'Text', text: glyph('script') })).resolves.toHaveLength(1)
})

test('a model pick is stored under the song key', async ($, on) => {
  const store: Record<string, unknown> = {}
  beneath(on, PLAYING, [], store)
  await $.session.start(START)
  await settle()

  expect(Object.keys(store)).toEqual([`theme:${KEY}`])
})
