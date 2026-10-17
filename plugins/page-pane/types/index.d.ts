export type View = {
  id: string
  title: string
  link: string
  markdown: string
  bannerFile: string | null
  generation: number
  error: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'page-pane': { view: View | null }
  }
}
