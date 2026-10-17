export type Count = number

declare module 'claude-code' {
  interface PluginState {
    'decision-logger': { logged: Count }
  }
}
