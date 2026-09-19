import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('qvacAPI', {
  loadModel: (): Promise<string> => ipcRenderer.invoke('load-model'),

  infer: (history: { role: string; content: string }[]): Promise<void> =>
    ipcRenderer.invoke('infer', history),

  onCompletionStream: (cb: (token: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, token: string) => {
      cb(token)
    }

    ipcRenderer.on('completion-stream', listener)

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('completion-stream', listener)
    }
  },

  unloadModel: (): Promise<string> => ipcRenderer.invoke('unload-model')
})
