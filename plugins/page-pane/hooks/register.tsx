import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { View } from '../types'
import { SITE_URL, VERSIONS_URL, bannerUrl, cardMarkdown, findProducts, listIds, resolveLink } from './site'
import type { Site } from './site'

const PANE = 'page-pane'
const MAX_BANNER_BYTES = 2 * 1024 * 1024

const view = atom({ plugin: 'page-pane', key: 'view' } as const, null as View | null)

type Loaded =
  | { kind: 'ok'; view: View }
  | { kind: 'none' }
  | { kind: 'many'; ids: string[] }
  | { kind: 'error'; message: string }

async function fetchJson($: EngineInterface, url: string): Promise<unknown> {
  const res = await $.http.fetch(url)

  if (!res.ok) {
    throw new Error(`${url} answered ${res.status}`)
  }

  return JSON.parse(res.text)
}

// The terminal reads the picture off disk itself, so the banner goes to a file, not through `$`.
async function downloadBanner($: EngineInterface, id: string, url: string): Promise<string | null> {
  try {
    const tmp = (await $.env.get('TEMP')) ?? (await $.env.get('TMPDIR')) ?? '/tmp'
    const sep = tmp.includes('\\') ? '\\' : '/'
    const file = `${tmp.replace(/[\\/]+$/, '')}${sep}page-pane${sep}${id}.png`
    const ran = await $.process.run(
      ['curl', '-sL', '--create-dirs', '-o', file, '-w', '%{http_code} %{size_download}', url],
      { timeoutMs: 20000 },
    )
    const [code, size] = ran.stdout.trim().split(' ')
    const bytes = Number(size)
    const isUsable = ran.exitCode === 0 && code === '200' && bytes > 0 && bytes <= MAX_BANNER_BYTES

    return isUsable ? file : null
  } catch {
    return null
  }
}

async function fetchSite($: EngineInterface): Promise<Site> {
  return (await fetchJson($, SITE_URL)) as Site
}

async function loadCard($: EngineInterface, query: string, generation: number): Promise<Loaded> {
  let site: Site

  try {
    site = await fetchSite($)
  } catch (error) {
    return { kind: 'error', message: `Could not read the portfolio feed. ${String(error)}` }
  }

  const found = findProducts(site, query)

  if (found.length === 0) {
    return { kind: 'none' }
  }

  if (found.length > 1) {
    return { kind: 'many', ids: found.map(p => p.id) }
  }

  const product = found[0]
  let versions: Record<string, string> = {}

  try {
    versions = (await fetchJson($, VERSIONS_URL)) as Record<string, string>
  } catch {
    // Versions are garnish. The card stands without them.
  }

  const bannerFile = await downloadBanner($, product.id, bannerUrl(product))

  return {
    kind: 'ok',
    view: {
      id: product.id,
      title: product.title ?? product.id,
      link: resolveLink(product),
      markdown: cardMarkdown(product, versions[product.id]),
      bannerFile,
      generation,
      error: null,
    },
  }
}

async function openInBrowser($: EngineInterface, url: string): Promise<void> {
  const isWindows = (await $.env.get('OS')) === 'Windows_NT'
  const isMac = ((await $.env.get('HOME')) ?? '').startsWith('/Users/')
  const argv = isWindows ? ['rundll32', 'url.dll,FileProtocolHandler', url] : [isMac ? 'open' : 'xdg-open', url]

  await $.process.run(argv)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'page',
      description: "Open a project's portfolio card in a side pane",
      argumentHint: '<project>',
    })

    return next(e)
  })

  on('command.run', { command: 'page' }, async ($, e) => {
    const query = e.args.trim()

    if (query === '') {
      try {
        return { text: `Projects: ${listIds(await fetchSite($)).join(', ')}` }
      } catch (error) {
        return { text: `Could not read the portfolio feed. ${String(error)}` }
      }
    }

    const loaded = await loadCard($, query, 0)

    if (loaded.kind === 'error') {
      return { text: loaded.message }
    }

    if (loaded.kind === 'none') {
      return { text: `No project matches "${query}". Run /page with no argument for the list.` }
    }

    if (loaded.kind === 'many') {
      return { text: `Several match "${query}": ${loaded.ids.join(', ')}. Be more specific.` }
    }

    await update($, view, () => loaded.view)
    await $.ui.open({ id: PANE, title: loaded.view.title })

    return { text: `${loaded.view.title} opened in the pane.` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Image, Link, Markdown, Text } = $.ui.resolve(e)
    const current = await read($, view)

    if (current === null) {
      return <Text dimColor>Run /page &lt;project&gt; to open a card.</Text>
    }

    const refresh = async () => {
      const loaded = await loadCard($, current.id, current.generation + 1)

      if (loaded.kind === 'ok') {
        await update($, view, () => loaded.view)
      } else if (loaded.kind === 'error') {
        await update($, view, v => (v === null ? v : { ...v, error: loaded.message }))
      }
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>{current.title}</Text>
        {current.error !== null && <Text color="red">{current.error}</Text>}
        {current.bannerFile !== null && (
          <Image
            key="banner"
            source={{ file: current.bannerFile, format: 'png', generation: current.generation }}
            columns={60}
            rows={15}
            alt={`${current.title} banner`}
          />
        )}
        <Markdown text={current.markdown} />
        <Link href={current.link} label={current.link} />
        <Box gap={2}>
          <Button key="refresh" label="Refresh" onPress={refresh} />
          <Button key="open" label="Open in browser" onPress={() => openInBrowser($, current.link)} />
        </Box>
      </Box>
    )
  })
}
