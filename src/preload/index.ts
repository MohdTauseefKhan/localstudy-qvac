import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('qvacAPI', {
  loadModel: (): Promise<string> => ipcRenderer.invoke('load-model'),

  infer: (history: { role: 'user' | 'assistant'; content: string }[]): Promise<void> =>
    ipcRenderer.invoke('infer', history),

  onCompletionStream: (cb: (token: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, token: string) => {
      cb(token)
    }

    ipcRenderer.on('completion-stream', handler)

    return () => {
      ipcRenderer.removeListener('completion-stream', handler)
    }
  },

  unloadModel: (): Promise<string> => ipcRenderer.invoke('unload-model')
})
