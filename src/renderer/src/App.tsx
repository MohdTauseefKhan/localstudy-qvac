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
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingModel, setLoadingModel] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [error, setError] = useState('')

  // QVAC completion stream listener
  useEffect(() => {
    const cleanup = window.qvacAPI.onCompletionStream((token) => {
      if (token === '') {
        setGenerating(false)
        return
      }

      setAnswer((current) => current + token)
    })

    return cleanup
  }, [])

  const askAI = async (): Promise<void> => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || generating || loadingModel) {
      return
    }

    setError('')
    setAnswer('')

    const userMessage: Message = {
      role: 'user',
      content: trimmedQuestion
    }

    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setQuestion('')

    try {
      if (!modelLoaded) {
        setLoadingModel(true)

        await window.qvacAPI.loadModel()

        setModelLoaded(true)
        setLoadingModel(false)
      }

      setGenerating(true)

      await window.qvacAPI.infer(updatedMessages)
    } catch (err) {
      setLoadingModel(false)
      setGenerating(false)

      const message =
        err instanceof Error ? err.message : 'Something went wrong.'

      setError(message)
    }
  }

  useEffect(() => {
    if (!generating && answer) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: answer
        }
      ])
    }
  }, [generating])

  const clearConversation = (): void => {
    if (generating || loadingModel) {
      return
    }

    setMessages([])
    setAnswer('')
    setQuestion('')
    setError('')
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
    <div className="h-screen overflow-hidden bg-[#080b14] text-slate-100">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8">

        {/* Header */}
        <header className="shrink-0 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-xl backdrop-blur-xl sm:px-5">

          <div className="flex items-center justify-between gap-3">

            {/* Brand */}
            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg shadow-lg shadow-blue-500/20 sm:h-11 sm:w-11">
                🧠
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                  LocalStudy
                </h1>

                <p className="hidden text-xs text-slate-500 sm:block">
                  Private AI Study Assistant
                </p>
              </div>

            </div>

            {/* Status + clear */}
            <div className="flex items-center gap-2">

              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  disabled={generating || loadingModel}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">
                    New chat
                  </span>

                  <span className="sm:hidden">
                    +
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-400 sm:px-3 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                <span className="hidden sm:inline">
                  QVAC Local AI
                </span>

                <span className="sm:hidden">
                  Local
                </span>
              </div>

            </div>

          </div>
        </header>

        {/* Main */}
        <main className="flex min-h-0 flex-1 flex-col py-3 sm:py-4">

          {/* Chat container */}
          <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl">

            <div className="h-full overflow-y-auto">

              <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-3 py-5 sm:px-6 sm:py-7 lg:px-8">

                {/* Empty state */}
                {messages.length === 0 &&
                  !answer &&
                  !error &&
                  !generating &&
                  !loadingModel && (
                    <div className="flex flex-1 flex-col items-center justify-center px-3 py-10 text-center">

                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-3xl shadow-lg shadow-blue-500/10">
                        📚
                      </div>

                      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        What do you want to learn?
                      </h2>

                      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                        Ask LocalStudy about programming, mathematics,
                        computer science, or any topic you're studying.
                      </p>

                      <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">

                        <button
                          onClick={() =>
                            setQuestion('Explain inheritance in Java')
                          }
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-slate-200"
                        >
                          <span className="mb-1 block text-sm">
                            ☕ Java
                          </span>

                          Explain inheritance
                        </button>

                        <button
                          onClick={() =>
                            setQuestion('Explain supervised learning')
                          }
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-slate-200"
                        >
                          <span className="mb-1 block text-sm">
                            🤖 Machine Learning
                          </span>

                          Explain supervised learning
                        </button>

                        <button
                          onClick={() =>
                            setQuestion('What is a binary search tree?')
                          }
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-slate-200"
                        >
                          <span className="mb-1 block text-sm">
                            🌳 Data Structures
                          </span>

                          Explain binary search tree
                        </button>

                      </div>

                    </div>
                  )}

                {/* Loading */}
                {loadingModel && (
                  <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">

                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                    </div>

                    <h2 className="text-base font-semibold text-white">
                      Loading local AI
                    </h2>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                      QVAC is preparing the model on your device.
                      The first load can take a little longer.
                    </p>

                  </div>
                )}

                {/* Conversation */}
                {messages.length > 0 && (
                  <div className="space-y-7">

                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={
                          message.role === 'user'
                            ? 'flex justify-end'
                            : 'flex justify-start'
                        }
                      >

                        {message.role === 'user' ? (

                          <div className="max-w-[90%] sm:max-w-[75%]">

                            <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-blue-500 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-blue-900/20 sm:px-5">
                              {message.content}
                            </div>

                          </div>

                        ) : (

                          <div className="w-full">

                            <div className="mb-3 flex items-center gap-2.5">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-sm shadow-md">
                                🧠
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-slate-200 sm:text-sm">
                                  LocalStudy AI
                                </p>

                                <p className="text-[10px] text-emerald-400 sm:text-xs">
                                  Generated locally with QVAC
                                </p>
                              </div>

                            </div>

                            <div className="rounded-2xl rounded-tl-md border border-white/10 bg-[#0b1020] p-4 shadow-lg sm:p-6">

                              <div className="text-sm leading-7 text-slate-200 sm:text-[15px]">

                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ children }) => (
                                      <h1 className="mb-4 mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                                        {children}
                                      </h1>
                                    ),

                                    h2: ({ children }) => (
                                      <h2 className="mb-3 mt-7 text-lg font-bold text-white sm:text-xl">
                                        {children}
                                      </h2>
                                    ),

                                    h3: ({ children }) => (
                                      <h3 className="mb-2 mt-5 text-base font-semibold text-blue-300 sm:text-lg">
                                        {children}
                                      </h3>
                                    ),

                                    p: ({ children }) => (
                                      <p className="mb-4 leading-7 text-slate-300">
                                        {children}
                                      </p>
                                    ),

                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-white">
                                        {children}
                                      </strong>
                                    ),

                                    ul: ({ children }) => (
                                      <ul className="mb-4 ml-5 list-disc space-y-1.5 text-slate-300">
                                        {children}
                                      </ul>
                                    ),

                                    ol: ({ children }) => (
                                      <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-slate-300">
                                        {children}
                                      </ol>
                                    ),

                                    li: ({ children }) => (
                                      <li className="pl-1 leading-6">
                                        {children}
                                      </li>
                                    ),

                                    blockquote: ({ children }) => (
                                      <blockquote className="mb-4 border-l-2 border-blue-500 bg-blue-500/5 px-4 py-3 text-slate-400">
                                        {children}
                                      </blockquote>
                                    ),

                                    pre: ({ children }) => (
                                      <pre className="mb-5 mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#070b14] p-4">
                                        {children}
                                      </pre>
                                    ),

                                    code: ({
                                      className,
                                      children,
                                      ...props
                                    }) => {
                                      const isBlock =
                                        className?.includes('language-')

                                      if (isBlock) {
                                        return (
                                          <code
                                            className="font-mono text-xs leading-6 text-slate-200 sm:text-sm"
                                            {...props}
                                          >
                                            {children}
                                          </code>
                                        )
                                      }

                                      return (
                                        <code
                                          className="rounded-md border border-white/10 bg-slate-800/80 px-1.5 py-0.5 font-mono text-xs text-blue-300"
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      )
                                    },

                                    hr: () => (
                                      <hr className="my-6 border-white/10" />
                                    ),

                                    table: ({ children }) => (
                                      <div className="mb-5 overflow-x-auto">
                                        <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                                          {children}
                                        </table>
                                      </div>
                                    ),

                                    th: ({ children }) => (
                                      <th className="border border-white/10 bg-slate-800/60 px-3 py-2 font-semibold text-white">
                                        {children}
                                      </th>
                                    ),

                                    td: ({ children }) => (
                                      <td className="border border-white/10 px-3 py-2 text-slate-300">
                                        {children}
                                      </td>
                                    )
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>

                              </div>

                            </div>

                          </div>

                        )}

                      </div>
                    ))}

                    {/* Current streaming response */}
                    {generating && answer && (
                      <div className="w-full">

                        <div className="mb-3 flex items-center gap-2.5">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-sm">
                            🧠
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-200 sm:text-sm">
                              LocalStudy AI
                            </p>

                            <p className="text-[10px] text-emerald-400 sm:text-xs">
                              Generating locally...
                            </p>
                          </div>

                        </div>

                        <div className="rounded-2xl rounded-tl-md border border-white/10 bg-[#0b1020] p-4 sm:p-6">

                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300 sm:text-[15px]">
                            {answer}
                          </div>

                          <span className="mt-3 inline-block h-4 w-1 animate-pulse rounded-full bg-blue-500" />

                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* Generating */}
                {generating && !answer && (
                  <div className="flex flex-1 items-center justify-center">

                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-slate-400">

                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" />

                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
                          style={{ animationDelay: '150ms' }}
                        />

                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>

                      Thinking locally...

                    </div>

                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-red-500/20 bg-red-500/5 p-4">

                    <p className="mb-1 text-xs font-semibold text-red-400">
                      Something went wrong
                    </p>

                    <p className="text-xs leading-5 text-red-300/80">
                      {error}
                    </p>

                  </div>
                )}

              </div>

            </div>
          </section>

          {/* Composer */}
          <div className="mx-auto mt-3 w-full max-w-4xl shrink-0 sm:mt-4">

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-2xl backdrop-blur-xl sm:p-3">

              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask LocalStudy anything..."
                disabled={loadingModel || generating}
                rows={2}
                className="max-h-32 min-h-[52px] w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed sm:px-3"
              />

              <div className="flex items-center justify-between gap-3 border-t border-white/5 px-2 pt-2 sm:px-3 sm:pt-3">

                <p className="hidden text-[11px] text-slate-600 sm:block">
                  Enter to ask · Shift + Enter for new line
                </p>

                <p className="text-[10px] text-slate-600 sm:hidden">
                  Enter to ask
                </p>

                <button
                  onClick={() => void askAI()}
                  disabled={
                    !question.trim() ||
                    loadingModel ||
                    generating
                  }
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
                >
                  {loadingModel
                    ? 'Loading...'
                    : generating
                      ? 'Thinking...'
                      : 'Ask AI'}

                  {!loadingModel && !generating && (
                    <span className="text-sm">
                      ↵
                    </span>
                  )}
                </button>

              </div>

            </div>

            <p className="mt-2 text-center text-[10px] text-slate-700">
              LocalStudy · Your questions stay on your device
            </p>

          </div>

        </main>

      </div>
    </div>
  )
}

export default App