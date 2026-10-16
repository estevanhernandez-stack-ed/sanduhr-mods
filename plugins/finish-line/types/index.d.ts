export type Race = { tag: string; startedAt: number }

declare module 'claude-code' {
  interface PluginState {
    'finish-line': { race: Race | null }
  }
}
