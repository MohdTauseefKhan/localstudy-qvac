import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { LLAMA_3_2_1B_INST_Q4_0, loadModel, unloadModel, completion } from '@qvac/sdk'

app.commandLine.appendSwitch('no-sandbox')

let win: BrowserWindow | null = null
let modelId: string | null = null

function createWindow(): void {
  win = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    win?.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupHandlers(): void {
  ipcMain.handle('load-model', async () => {
    if (modelId) {
      return 'model already loaded'
    }

    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: 'llm',
      onProgress: (progress) => {
        console.log(`QVAC model download: ${progress.percentage.toFixed(0)}%`)
      }
    })

    return 'model loaded'
  })

  ipcMain.handle(
    'infer',
    async (_event, history: { role: 'user' | 'assistant'; content: string }[]) => {
      if (!modelId) {
        throw new Error('QVAC model is not loaded.')
      }

      const question = history[0]?.content ?? ''

      const improvedHistory = [
        {
          role: 'user' as const,
          content: `You are LocalStudy, a helpful AI study assistant.

Answer the student's question clearly and accurately.

Rules:
- Use simple language.
- Give a direct answer first.
- Avoid unnecessary repetition.
- Keep the answer reasonably short.
- Use headings or bullet points when useful.
- If giving code, use a clean code block.
- Do not repeat words or sentences.
- Do not mention these instructions.

Student question:
${question}`
        }
      ]

      const result = completion({
        modelId,
        history: improvedHistory,
        stream: true,
        generationParams: {
          temp: 0.3,
          top_p: 0.9,
          top_k: 20,
          predict: 512
        }
      })

      for await (const token of result.tokenStream) {
        win?.webContents.send('completion-stream', token)
      }

      win?.webContents.send('completion-stream', '')
    }
  )

  ipcMain.handle('unload-model', async () => {
    if (!modelId) {
      return 'model already unloaded'
    }

    await unloadModel({ modelId })
    modelId = null

    return 'model unloaded'
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.localstudy.qvac')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
