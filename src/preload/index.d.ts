declare global {
  interface Window {
    qvacAPI: {
      loadModel: () => Promise<string>

      infer: (history: { role: 'user' | 'assistant'; content: string }[]) => Promise<void>

      onCompletionStream: (cb: (token: string) => void) => () => void

      unloadModel: () => Promise<string>
    }
  }
}

export {}
