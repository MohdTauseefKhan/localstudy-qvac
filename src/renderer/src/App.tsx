import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function App(): React.JSX.Element {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loadingModel, setLoadingModel] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = window.qvacAPI.onCompletionStream((token) => {
      if (token === '') {
        setGenerating(false)
        return
      }

      setAnswer((current) => current + token)
    })

    return unsubscribe
  }, [])

  const askAI = async (): Promise<void> => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || generating || loadingModel) {
      return
    }

    setError('')
    setAnswer('')

    try {
      if (!modelLoaded) {
        setLoadingModel(true)

        await window.qvacAPI.loadModel()

        setModelLoaded(true)
        setLoadingModel(false)
      }

      setGenerating(true)

      const history: Message[] = [
        {
          role: 'user',
          content: trimmedQuestion
        }
      ]

      await window.qvacAPI.infer(history)
    } catch (err) {
      setLoadingModel(false)
      setGenerating(false)

      const message =
        err instanceof Error ? err.message : 'Something went wrong.'

      setError(message)
    }
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void askAI()
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-white">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-6 py-6">

        {/* Header */}
        <header className="shrink-0 border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-lg shadow-blue-600/20">
                🧠
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  LocalStudy
                </h1>

                <p className="text-xs text-slate-400">
                  Private AI Study Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              QVAC Local AI
            </div>

          </div>
        </header>

        {/* Main content */}
        <main className="flex min-h-0 flex-1 flex-col py-5">

          {/* Chat area */}
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl">

            <div className="h-full overflow-y-auto p-6">

              {/* Empty state */}
              {!answer && !error && !generating && !loadingModel && (
                <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-4xl">
                    📚
                  </div>

                  <h2 className="mb-2 text-2xl font-semibold">
                    What do you want to learn?
                  </h2>

                  <p className="max-w-lg text-sm leading-6 text-slate-400">
                    Ask LocalStudy anything about programming, mathematics,
                    computer science, or your study topics.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                      Java inheritance
                    </span>

                    <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                      Machine Learning
                    </span>

                    <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                      Data Structures
                    </span>
                  </div>

                </div>
              )}

              {/* Loading model */}
              {loadingModel && (
                <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">

                  <div className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

                  <h2 className="mb-2 text-lg font-semibold">
                    Loading local AI model
                  </h2>

                  <p className="text-sm text-slate-400">
                    QVAC is preparing the model on your device...
                  </p>

                </div>
              )}

              {/* Generating */}
              {generating && !answer && (
                <div className="flex items-center gap-3 text-sm text-slate-400">

                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />

                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                      style={{ animationDelay: '150ms' }}
                    />

                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>

                  Generating response locally...

                </div>
              )}

              {/* AI response */}
              {answer && (
                <div className="mx-auto max-w-3xl">

                  <div className="mb-5 flex items-center gap-2">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm">
                      🧠
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        LocalStudy AI
                      </p>

                      <p className="text-xs text-emerald-400">
                        Generated locally with QVAC
                      </p>
                    </div>

                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">

                    <div className="text-[15px] leading-7 text-slate-200">

                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="mb-4 mt-2 text-2xl font-bold text-white">
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2 className="mb-3 mt-6 text-xl font-bold text-white">
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3 className="mb-2 mt-5 text-lg font-semibold text-blue-300">
                              {children}
                            </h3>
                          ),

                          p: ({ children }) => (
                            <p className="mb-4 leading-7 text-slate-200">
                              {children}
                            </p>
                          ),

                          strong: ({ children }) => (
                            <strong className="font-semibold text-white">
                              {children}
                            </strong>
                          ),

                          ul: ({ children }) => (
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-200">
                              {children}
                            </ul>
                          ),

                          ol: ({ children }) => (
                            <ol className="mb-4 ml-6 list-decimal space-y-2 text-slate-200">
                              {children}
                            </ol>
                          ),

                          li: ({ children }) => (
                            <li className="pl-1 leading-6">
                              {children}
                            </li>
                          ),

                          blockquote: ({ children }) => (
                            <blockquote className="mb-4 border-l-4 border-blue-500 bg-blue-950/20 px-4 py-3 text-slate-300">
                              {children}
                            </blockquote>
                          ),

                          code: ({ className, children, ...props }) => {
                            const isBlock = className?.includes('language-')

                            if (isBlock) {
                              return (
                                <pre className="mb-5 mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
                                  <code
                                    className="font-mono text-sm leading-6 text-slate-200"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                </pre>
                              )
                            }

                            return (
                              <code
                                className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-blue-300"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },

                          hr: () => (
                            <hr className="my-6 border-slate-800" />
                          )
                        }}
                      >
                        {answer}
                      </ReactMarkdown>

                    </div>

                    {generating && (
                      <span className="mt-3 inline-block h-5 w-1 animate-pulse bg-blue-500" />
                    )}

                  </div>

                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mx-auto max-w-3xl rounded-xl border border-red-900/60 bg-red-950/30 p-5">

                  <p className="mb-2 text-sm font-semibold text-red-400">
                    Something went wrong
                  </p>

                  <p className="text-sm leading-6 text-red-200">
                    {error}
                  </p>

                </div>
              )}

            </div>
          </div>

          {/* Input */}
          <div className="mt-4 shrink-0 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-xl">

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something... e.g. Explain inheritance in Java"
              disabled={loadingModel || generating}
              rows={2}
              className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
            />

            <div className="flex items-center justify-between border-t border-slate-800 px-2 pt-3">

              <p className="text-xs text-slate-500">
                Enter to ask · Shift + Enter for new line
              </p>

              <button
                onClick={() => void askAI()}
                disabled={
                  !question.trim() || loadingModel || generating
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loadingModel
                  ? 'Loading...'
                  : generating
                    ? 'Thinking...'
                    : 'Ask AI'}
              </button>

            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between pt-3 text-[11px] text-slate-600">
          <span>LocalStudy</span>

          <span>
            On-device AI · Powered by QVAC
          </span>
        </footer>

      </div>
    </div>
  )
}

export default App