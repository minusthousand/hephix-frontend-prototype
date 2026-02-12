import { useEffect, useRef, useState } from 'react'
import './App.css'

type Store = 'depo' | 'darel' | 'ebay'
type Theme = 'light' | 'dark'

type ChatMessage = {
  id: number
  role: 'user' | 'ai'
  text: string
}

type SessionInfo = {
  session_id: string
  updated_at: number
}

function App() {
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string>(
    () => localStorage.getItem('hephix_sid') || ''
  )
  const [store, setStore] = useState<Store>(
    () => (localStorage.getItem('hephix_store') as Store) || 'depo'
  )
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('hephix_theme') as Theme) || 'light'
  )

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const apiBaseUrl = import.meta.env.VITE_CHAT_API_URL || ''

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('hephix_theme', theme)
  }, [theme])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Load existing session on mount if we have one
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSessions() {
    try {
      const res = await fetch(`${apiBaseUrl}/sessions?limit=50`)
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      // silently fail
    }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`${apiBaseUrl}/sessions/${id}`)
      const data = await res.json()
      setSessionId(data.session_id)
      localStorage.setItem('hephix_sid', data.session_id)

      // Detect store from session id prefix
      const detectedStore = data.session_id.startsWith('darel-')
        ? 'darel'
        : data.session_id.startsWith('ebay-')
        ? 'ebay'
        : 'depo'
      setStore(detectedStore)
      localStorage.setItem('hephix_store', detectedStore)

      const loaded: ChatMessage[] = []
      for (const m of data.messages || []) {
        const type = m.type || 'unknown'
        
        if (type === 'system') continue
        
        let content = ''
        if (m.data && m.data.content !== undefined) {
          // Handle arrays of content (AI messages with tool calls)
          if (Array.isArray(m.data.content)) {
            // Extract only text messages, skip tool_use
            const textParts = m.data.content
              .filter((item: any) => item.type === 'text')
              .map((item: any) => item.text)
            content = textParts.join('\n')
          } else if (typeof m.data.content === 'string') {
            content = m.data.content
          } else {
            content = String(m.data.content)
          }
        }
        
        if (type === 'human') {
          loaded.push({ id: loaded.length, role: 'user', text: content })
        } else if (type === 'ai') {
          loaded.push({ id: loaded.length, role: 'ai', text: content })
        }
      }
      setMessages(loaded)
      setError('')
      loadSessions()
    } catch {
      // silently fail
    }
  }

  function getChatEndpoint() {
    if (store === 'darel') return `${apiBaseUrl}/chat/darel`
    if (store === 'ebay') return `${apiBaseUrl}/chat/ebay`
    return `${apiBaseUrl}/chat`
  }

  function handleNewChat() {
    setSessionId('')
    setMessages([])
    setError('')
    localStorage.removeItem('hephix_sid')
    loadSessions()
    inputRef.current?.focus()
  }

  function handleStoreChange(newStore: Store) {
    setStore(newStore)
    localStorage.setItem('hephix_store', newStore)
    // Start fresh when switching stores
    handleNewChat()
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  async function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed || isSending) return

    setError('')
    setIsSending(true)
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')

    try {
      const response = await fetch(getChatEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          session_id: sessionId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Save session id
      if (data.session_id) {
        setSessionId(data.session_id)
        localStorage.setItem('hephix_sid', data.session_id)
      }

      const responseText =
        typeof data.response === 'string' ? data.response.trim() : ''

      if (!responseText) {
        throw new Error('Empty response from server')
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: responseText,
        },
      ])

      loadSessions()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to reach server'
      setError(message)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const storeLabel =
    store === 'darel' ? 'Darel.lv' : store === 'ebay' ? 'eBay' : 'Depo.lv'

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <div className="sidebar-actions">
            <button className="btn-new" onClick={handleNewChat}>
              + New
            </button>
            <button
              className="btn-toggle-sidebar"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="session-list">
          {sessions.map((s) => {
            const isDarel = s.session_id.startsWith('darel-')
            const isEbay = s.session_id.startsWith('ebay-')
            const icon = isDarel ? '🔧' : isEbay ? '🛒' : '🏠'
            const isActive = s.session_id === sessionId
            return (
              <div
                key={s.session_id}
                className={`session-item ${isActive ? 'active' : ''}`}
                onClick={() => loadSession(s.session_id)}
              >
                <span className="session-label">
                  {icon} {s.session_id.slice(0, 12)}…
                </span>
                <span className="session-time">
                  {new Date(s.updated_at * 1000).toLocaleString()}
                </span>
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="no-sessions">No conversations yet</div>
          )}
        </div>

        <div className="store-toggle">
          <label htmlFor="store-select">Store</label>
          <select
            id="store-select"
            value={store}
            onChange={(e) => handleStoreChange(e.target.value as Store)}
          >
            <option value="depo">🏠 Depo.lv (default)</option>
            <option value="darel">🔧 Darel.lv</option>
            <option value="ebay">🛒 eBay</option>
          </select>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="main">
        <header className="app-header">
          {!sidebarOpen && (
            <button
              className="btn-open-sidebar"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
          )}
          <div className="logo">hephix</div>
          <span className={`store-badge ${store}`}>{storeLabel}</span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀︎' : '☾'}
          </button>
        </header>

        <section className="chat-card">
          <div className="chat-window">
            {messages.length === 0 && !error && (
              <div className="welcome">
                <h2>Welcome to Hephix</h2>
                <p>
                  Your AI shopping assistant for Latvian stores.
                  <br />
                  Try: &quot;Find me power drills&quot; or &quot;What screws do
                  you have?&quot;
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === 'user' ? 'me' : 'them'}`}
              >
                <div className="bubble">
                  <p>{message.text}</p>
                </div>
              </div>
            ))}

            {error && (
              <div className="message them">
                <div className="bubble error">
                  <p>{error}</p>
                </div>
              </div>
            )}

            {isSending && (
              <div className="message them">
                <div className="bubble typing" aria-label="Assistant is typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
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
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Ask ${storeLabel} about products...`}
                aria-label="Type a message"
                disabled={isSending}
              />
              <div className="input-meta">
                {isSending ? 'Thinking...' : 'Press Enter to send'}
              </div>
            </div>
            <button type="submit" className="send" disabled={isSending}>
              Send
            </button>
          </form>
        </section>
      </main>
      </div>
    </>
  )
}

export default App
