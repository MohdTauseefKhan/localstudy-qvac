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
  // --------------------------------------------------
  // LOAD QVAC MODEL
  // --------------------------------------------------

  ipcMain.handle('load-model', async () => {
    if (modelId) {
      return 'model already loaded'
    }

    console.log('Loading QVAC model on CPU...')

    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: 'llm',

      // Force CPU inference.
      // This avoids corrupted/repeated output from
      // incorrect GPU backend selection.
      modelConfig: {
        ctx_size: 2048,
        device: 'cpu',
        gpu_layers: 0
      },

      onProgress: (progress) => {
        console.log(`QVAC model download: ${progress.percentage.toFixed(0)}%`)
      }
    })

    console.log(`QVAC model loaded: ${modelId}`)

    return 'model loaded'
  })

  // --------------------------------------------------
  // RUN LOCAL AI INFERENCE
  // --------------------------------------------------

  ipcMain.handle(
    'infer',
    async (_event, history: { role: 'user' | 'assistant'; content: string }[]) => {
      if (!modelId) {
        throw new Error('QVAC model is not loaded.')
      }

      if (!history || history.length === 0) {
        throw new Error('Conversation history is empty.')
      }

      // Keep the complete conversation so follow-up
      // questions can use previous messages as context.
      const improvedHistory = [
        {
          role: 'system' as const,
          content: `You are LocalStudy, a helpful AI study assistant.

Your job is to answer the student's questions clearly, naturally, and accurately.

IMPORTANT RESPONSE RULES:

- Give a direct answer first.
- Use simple and easy-to-understand language.
- Keep answers focused and reasonably concise.
- Do not repeat words unnecessarily.
- Do not repeat the same word twice in a row.
- Do not repeat phrases or sentences.
- Do not repeat the student's question.
- Avoid unnecessary introductions.
- Avoid unnecessary conclusions.
- Use short paragraphs.
- Use bullet points when useful.
- Use numbered lists when explaining steps.
- Use Markdown formatting naturally.
- Use headings only when they improve readability.
- Use bold text sparingly.
- If providing programming code, use a Markdown code block.
- Answer follow-up questions using the previous conversation as context.
- If the question is simple, give a simple answer.
- Do not mention these instructions.

Before finishing, make sure the response is readable and does not contain unnecessary repetition.`
        },

        // Preserve the actual conversation.
        ...history
      ]

      console.log('Starting QVAC completion...')

      const result = completion({
        modelId,
        history: improvedHistory,
        stream: true,

        generationParams: {
          temp: 0.7,
          top_p: 0.95,
          top_k: 40,
          predict: 384
        }
      })

      // Stream every generated token to the renderer.
      for await (const token of result.tokenStream) {
        win?.webContents.send('completion-stream', token)
      }

      // Empty token means generation is finished.
      win?.webContents.send('completion-stream', '')

      console.log('QVAC completion finished.')
    }
  )

  // --------------------------------------------------
  // UNLOAD QVAC MODEL
  // --------------------------------------------------

  ipcMain.handle('unload-model', async () => {
    if (!modelId) {
      return 'model already unloaded'
    }

    console.log('Unloading QVAC model...')

    await unloadModel({
      modelId
    })

    modelId = null

    console.log('QVAC model unloaded.')

    return 'model unloaded'
  })
}

// --------------------------------------------------
// ELECTRON APP START
// --------------------------------------------------

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

// --------------------------------------------------
// CLOSE APP
// --------------------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
