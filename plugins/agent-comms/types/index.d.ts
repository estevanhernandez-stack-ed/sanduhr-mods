export type Pending = {
  id: number
  kind: 'send' | 'agent' | 'tool'
  label: string
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    'agent-comms': { pending: Pending[] }
  }
}
