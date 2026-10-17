// Pure helpers over the 626labs.dev feed. No `$` in here, so these test without an engine.

export const BASE = 'https://626labs.dev/'
export const SITE_URL = 'https://raw.githubusercontent.com/626Labs-LLC/626Labs-LLC.github.io/main/content/site.json'
export const VERSIONS_URL = `${BASE}data/plugin-versions.json`

export type Tag = { label?: string; tone?: string }

export type Product = {
  id: string
  title?: string
  tagline?: string
  description?: string
  status?: string
  tags?: Tag[]
  banner?: string | null
  productPage?: string | null
  liveUrl?: string | null
  storeUrl?: string | null
  meta?: string | null
}

export type Site = { products?: Product[] }

const squash = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// A path from the feed is relative to the site root, with or without a leading slash.
export function absolute(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return BASE + path.replace(/^\/+/, '')
}

// productPage, else liveUrl, else storeUrl, else the home-page row. Same order the site's own cards use.
export function resolveLink(product: Product): string {
  if (product.productPage) {
    return absolute(product.productPage)
  }

  return product.liveUrl || product.storeUrl || `${BASE}#work`
}

export function bannerUrl(product: Product): string {
  return absolute(product.banner || `assets/brand/plugins/${product.id}-banner-1280x640.png`)
}

export function listIds(site: Site): string[] {
  return (site.products ?? []).map(p => p.id)
}

// Exact id or title beats prefix beats substring. Only the best rank comes back, so a tie is a real ambiguity.
export function findProducts(site: Site, query: string): Product[] {
  const q = squash(query)

  if (q === '') {
    return []
  }

  const ranked = (site.products ?? [])
    .map(p => {
      const keys = [squash(p.id), squash(p.title ?? '')]
      const rank = keys.some(k => k === q) ? 0 : keys.some(k => k.startsWith(q)) ? 1 : keys.some(k => k.includes(q)) ? 2 : 3

      return { p, rank }
    })
    .filter(r => r.rank < 3)

  const best = Math.min(...ranked.map(r => r.rank), 3)

  return ranked.filter(r => r.rank === best).map(r => r.p)
}

export function cardMarkdown(product: Product, version: string | undefined): string {
  const tags = (product.tags ?? []).map(t => t.label).filter(Boolean)
  const facts = [product.status, version, ...tags].filter(Boolean).join(' | ')
  const lines = [
    product.tagline ? `**${product.tagline}**` : '',
    facts,
    product.meta ?? '',
    product.description ?? '',
  ].filter(l => l !== '')

  return lines.join('\n\n')
}
