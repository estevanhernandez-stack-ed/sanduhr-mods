import { expect, test } from 'claude-code/testing'

import { fixture, versionsFixture } from './fixture'

type World = { feed: number; bannerCode: string }

const RUN = (args: string) => ({ command: 'page', args, origin: { kind: 'composer' }, presentation: 'text' }) as never
const PANE = { plugin: 'page-pane', surface: 'terminal', component: 'Pane', requestId: 'page-pane', props: {} } as never

function stage(on: any, world: World) {
  on('session.start', (_$: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }) as never)
  on('ui.open', () => ({ value: undefined }) as never)
  // A rooted temp folder with no drive letter is absolute on Windows and macOS alike, so the Pane
  // accepts the banner path on either host (C:\tmp is relative on a Mac).
  on('env.get', (_$: unknown, e: { name: string }) => ({ value: e.name === 'TMPDIR' ? '/tmp' : undefined }) as never)
  on('http.fetch', (_$: unknown, e: { url: string }) => {
    const isVersions = e.url.endsWith('plugin-versions.json')
    const status = isVersions ? 200 : world.feed
    const text = isVersions ? JSON.stringify(versionsFixture) : JSON.stringify(fixture)

    return { value: { status, ok: status === 200, headers: {}, text } } as never
  })
  on('process.run', () => ({
    value: { exitCode: 0, stdout: `${world.bannerCode} 101546`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }) as never)
}

test('opens a card with summary, version and banner', async ($, on) => {
  stage(on, { feed: 200, bannerCode: '200' })

  const ran = await $.command.run(RUN('vibe-iterate'))
  expect(ran.text).toContain('opened')

  const pane = await $.ui.mount(PANE)
  await expect(pane.findAll({ type: 'Image' })).resolves.toHaveLength(1)
  await expect(pane.findAll({ type: 'Markdown', text: /v1\.4\.0/ })).resolves.toHaveLength(1)
  await expect(pane.findAll({ type: 'Button', text: /Refresh/ })).resolves.toHaveLength(1)
})

test('a missing banner leaves the card standing, just without the picture', async ($, on) => {
  stage(on, { feed: 200, bannerCode: '404' })

  await $.command.run(RUN('celestia'))

  const pane = await $.ui.mount(PANE)
  await expect(pane.findAll({ type: 'Image' })).resolves.toHaveLength(0)
  await expect(pane.findAll({ type: 'Markdown' })).resolves.toHaveLength(1)
})

test('a dead feed says so in one line and opens nothing', async ($, on) => {
  stage(on, { feed: 503, bannerCode: '200' })

  const ran = await $.command.run(RUN('vibe-iterate'))
  expect(ran.text).toContain('Could not read the portfolio feed')
})

test('an ambiguous name lists candidates, an unknown name points at the list', async ($, on) => {
  stage(on, { feed: 200, bannerCode: '200' })

  expect((await $.command.run(RUN('vibe'))).text).toContain('Several match')
  expect((await $.command.run(RUN('nonesuch'))).text).toContain('No project matches')
  expect((await $.command.run(RUN(''))).text).toContain('pod-pipeline')
})
