import { expect, mock, test } from 'claude-code/testing'

import { defaultTheme, styleText } from './theme'
import type { FontName } from './theme'

const BAND = { plugin: 'now-playing', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 4 } } as never
const START = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const RUN = (args: string) => ({ command: 'np', args, origin: { kind: 'composer' }, presentation: 'text' }) as never
// Playing, 63s in at stamp 1000; the mocked clock reads 1000, so live position is 1:03.
const LINE = '{"app":"Chrome","status":"Playing","artist":"Alien Ant Farm","title":"Smooth Criminal (Official Music Video)","posMs":63152,"endMs":212295,"stampMs":1000}\n'
const LRC = '[00:15.66] placeholder one\n[01:00.00] placeholder sung now\n[01:10.00] placeholder later'
const SONG = 'Alien Ant Farm\u0000Smooth Criminal (Official Music Video)'
const MODEL_PICK = '{"font":"mono","colors":["#ff2a6d","#05d9e8","#d16ba5"],"mood":"slick"}'

type Opts = { isWindows: boolean; lyricsStatus: number; playerSays: string; modelSays: string | null; files?: string[] }

const MAC = '/System/Library/CoreServices/SystemVersion.plist'
const ADAPTER = '/Applications/Sanduhr.app/Contents/Resources/NowPlaying/mediaremote-adapter.pl'

function beneath(on: any, opts: Opts, argvs: string[][] = [], store: Record<string, unknown> = {}, spawned: string[][] = []) {
  const clock = mock.clock(on, { now: 1000 })
  mock.store(on, store)
  on('session.start', (_$: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }) as never)
  on('env.get', (_$: unknown, e: { name: string }) => ({
    value: e.name === 'OS' && opts.isWindows ? 'Windows_NT' : e.name === 'HOME' ? '/Users/someone' : undefined,
  }) as never)
  on('fs.read', (_$: unknown, e: { path: string }) => {
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
  on('model.complete', () => ({
    value:
      opts.modelSays === null
        ? { isAnswered: false, reason: 'timeout', usage: {} }
        : { isAnswered: true, text: opts.modelSays, usage: {} },
  }) as never)
  on('process.spawn', async function* (_$: unknown, e: { argv: string[] }) {
    spawned.push(e.argv)
    yield { stream: 'stdout', text: LINE }

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
