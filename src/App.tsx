import { useEffect, useState } from 'react'
import './App.css'

type ProductResult = {
  title: string
  price: string
  thumbnail: string | null
  source?: string
  url?: string
}

type ChatMessage = {
  id: number
  me: boolean
  text?: string
  results?: ProductResult[]
}

function App() {
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('hephix-theme')
    if (stored === 'light' || stored === 'dark') return stored
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })
  const apiBaseUrl = import.meta.env.VITE_CHAT_API_URL || ''
  const apiUrl = `${apiBaseUrl}/chat`

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('hephix-theme', theme)
  }, [theme])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setError('')
    setIsSending(true)
    const userMessage: ChatMessage = {
      id: Date.now(),
      text: trimmed,
      me: true,
    }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data = (await response.json()) as {
        message?: string
        results?: ProductResult[]
      }
      const responseText =
        typeof data.message === 'string' ? data.message.trim() : ''
      const responseResults =
        Array.isArray(data.results) && data.results.length > 0
          ? data.results
          : undefined
      if (!responseText && !responseResults) {
        throw new Error('Empty response from server')
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: responseText || undefined,
          results: responseResults,
          me: false,
        },
      ])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to reach server'
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />
      <header className="site-header" aria-label="Hephix header">
        <div className="container nav">
          <div className="logo">
            <img src="/hephix-logo.svg" alt="Hephix logo" />
            <span>Hephix</span>
          </div>
          <div className="nav-links">
            <button
              type="button"
              className="theme-toggle"
              onClick={() =>
                setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
              }
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg
                  className="theme-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4.75a7.25 7.25 0 0 0 0 14.5 7.25 7.25 0 0 0 0-14.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 1.75v2.5M12 19.75v2.5M4.75 12H2.25M21.75 12h-2.5M5.47 5.47l-1.77-1.77M20.3 20.3l-1.77-1.77M18.53 5.47l1.77-1.77M3.7 20.3l1.77-1.77"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  className="theme-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M20 14.6a8.5 8.5 0 1 1-10.6-10 7 7 0 0 0 10.6 10Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <section className="chat-card" aria-label="Chat window">
              <div className="chat-header">
                <div>
                  <p className="eyebrow">Repair Session</p>
                  <h3>Hephix AI Workspace</h3>
                </div>
              </div>
              <div className="chat-window">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.me ? 'me' : 'them'}`}
                  >
                    {message.text ? (
                      <div className="bubble">
                        <p>{message.text}</p>
                      </div>
                    ) : null}
                    {message.results ? (
                      <div className="bubble results">
                        <div className="results-header">
                          <span>Results</span>
                          <span className="results-count">
                            {message.results.length}
                          </span>
                        </div>
                        <ul className="results-list">
                          {message.results.map((item, index) => (
                            <li
                              key={`${message.id}-${index}`}
                              className="result-card"
                            >
                              <div className="result-thumb">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="thumb-fallback">No image</div>
                                )}
                              </div>
                              <div className="result-body">
                                <div className="result-title">{item.title}</div>
                                <div className="result-meta">
                                  <span className="result-price">
                                    {item.price}
                                  </span>
                                  {item.source ? (
                                    <span className="result-source">
                                      {item.source}
                                    </span>
                                  ) : null}
                                </div>
                                {item.url ? (
                                  <a
                                    className="result-link"
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View product
                                  </a>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}
                {error ? (
                  <div className="message them">
                    <div className="bubble error">
                      <p>{error}</p>
                    </div>
                  </div>
                ) : null}
                {isSending ? (
                  <div className="message them">
                    <div className="bubble typing" aria-label="Assistant is typing">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                ) : null}
              </div>

              <form
                className="chat-input"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSend()
                }}
              >
                <div className="input-wrap">
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Describe the issue or part you need..."
                    aria-label="Type a message"
                    disabled={isSending}
                  />
                  <div className="input-meta">
                    {isSending ? 'Sending...' : 'Press Enter to send'}
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn primary send"
                  disabled={isSending}
                >
                  Send
                </button>
              </form>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
