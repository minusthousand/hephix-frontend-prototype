import { useState } from 'react'
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
  const apiBaseUrl = import.meta.env.VITE_CHAT_API_URL || ''
  const apiUrl = `${apiBaseUrl}/chat`

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
      <header className="app-header" aria-label="Hephix chat header">
        <div className="logo">hephix</div>
      </header>
      <section className="chat-card" aria-label="Chat window">
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
                            <span className="result-price">{item.price}</span>
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
              placeholder="Write a message..."
              aria-label="Type a message"
              disabled={isSending}
            />
            <div className="input-meta">
              {isSending ? 'Sending...' : 'Press Enter to send'}
            </div>
          </div>
          <button type="submit" className="send" disabled={isSending}>
            Send
          </button>
        </form>
      </section>
    </div>
  )
}

export default App
