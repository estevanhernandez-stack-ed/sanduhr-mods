import { expect, test } from 'claude-code/testing'

import { fixture } from './fixture'
import { bannerUrl, cardMarkdown, findProducts, listIds, resolveLink, type Site } from './site'

const site = fixture as Site
const one = (q: string) => findProducts(site, q)[0]

test('link: productPage beats everything, leading slash or not', async () => {
  expect(resolveLink(one('vibe-cartographer'))).toBe('https://626labs.dev/vibe-cartographer/')
  expect(resolveLink(one('rororo'))).toBe('https://626labs.dev/rororo.html')
})

test('link: liveUrl, then storeUrl, then the home-page row', async () => {
  expect(resolveLink(one('celestia'))).toBe('https://celestia.626labs.dev')
  expect(resolveLink(one('snapsnip'))).toContain('apps.microsoft.com')
  expect(resolveLink(one('pod-pipeline'))).toBe('https://626labs.dev/#work')
})

test('match: id, title, prefix and substring reach the same product', async () => {
  for (const q of ['vibe-cartographer', 'Vibe Cartographer', 'cartog', 'VIBECARTOGRAPHER']) {
    expect(one(q).id).toBe('vibe-cartographer')
  }
})

test('match: exact beats substring, and a tie is reported as a tie', async () => {
  expect(findProducts(site, 'rororo').map(p => p.id)).toEqual(['rororo'])
  expect(findProducts(site, 'vibe').length).toBeGreaterThan(1)
  expect(findProducts(site, 'nonesuch')).toEqual([])
  expect(findProducts(site, '   ')).toEqual([])
})

test('banner: own banner first, plugin banner as the fallback', async () => {
  expect(bannerUrl(one('celestia'))).toBe('https://626labs.dev/assets/thumb-celestia.png')
  expect(bannerUrl(one('vibe-iterate'))).toBe('https://626labs.dev/assets/brand/plugins/vibe-iterate-banner-1280x640.png')
})

test('markdown: version shows when known and is omitted when not', async () => {
  expect(cardMarkdown(one('vibe-iterate'), 'v1.4.0')).toContain('v1.4.0')
  expect(cardMarkdown(one('celestia'), undefined)).not.toContain('undefined')
})

test('ids: every fixture product is listed', async () => {
  expect(listIds(site)).toContain('pod-pipeline')
})
