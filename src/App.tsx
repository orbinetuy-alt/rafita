import { useState, useRef, useEffect } from 'react'
import './App.css'
import { sendToRafita } from './lib/rafita'
import { loadUser, clearUser, type RafitaUser } from './lib/auth'
import AuthModal from './components/AuthModal'

// Genera o recupera un sessionId único por navegador
function getSessionId(): string {
  const key = 'rafita_session_id'
  let id = localStorage.getItem(key)
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID()
    } else {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    }
    localStorage.setItem(key, id)
  }
  return id
}

const SESSION_ID = getSessionId()

const MODES = [
  { id: 'informant', label: 'Rafita Informant' },
  { id: 'planning',  label: 'Rafita Planning'  },
  { id: 'booking',   label: 'Rafita Booking'   },
]

const RECENT_CHATS = [
  'Hoteles en Lisboa para junio',
  'Ruta por el Algarve 7 días',
  'Vuelos baratos desde Madrid',
]

// Icono búsqueda
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

// Icono usuario
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

// Icono chat
const IconChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

// Icono logout
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

function App() {
  const [input, setInput]           = useState('')
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [user, setUser]             = useState<RafitaUser | null>(loadUser)
  const [showAuth, setShowAuth]     = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Array<{role: 'user'|'rafita', text: string}>>( [])
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleLogin = (loggedUser: RafitaUser) => {
    setUser(loggedUser)
    setShowAuth(false)
  }

  const handleLogout = () => {
    clearUser()
    setUser(null)
  }

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    if (!user) { setShowAuth(true); return }
    const message = input.trim()
    setInput('')
    setError(null)
    setLoading(true)
    setThinking(true)
    setMessages(prev => [...prev, { role: 'user', text: message }])
    try {
      const reply = await sendToRafita({
        message,
        sessionId: SESSION_ID,
        mode: activeMode,
        userId: user.userId,
        token: user.token,
      })
      setMessages(prev => [...prev, { role: 'rafita', text: reply }])
    } catch (err) {
      setError('No pude conectarme con Rafita. Intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const filteredChats = RECENT_CHATS.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app">

      {/* ── Modal de autenticación ── */}
      {showAuth && (
        <AuthModal
          onSuccess={handleLogin}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <button className="sidebar-new-btn">
          <span className="sidebar-new-icon">+</span>
          Nueva conversación
        </button>

        <div className="sidebar-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-label">Recientes</span>
          <ul className="sidebar-chats">
            {filteredChats.length > 0
              ? filteredChats.map((chat, i) => (
                  <li key={i} className="sidebar-chat-item">
                    <IconChat />
                    <span>{chat}</span>
                  </li>
                ))
              : <li className="sidebar-empty">Sin resultados</li>
            }
          </ul>
        </div>

        <div className="sidebar-footer">
          {user ? (
            <div className="sidebar-profile">
              <div className="sidebar-avatar">{user.name[0].toUpperCase()}</div>
              <span className="sidebar-profile-name">{user.name}</span>
              <button className="sidebar-logout-btn" onClick={handleLogout} title="Cerrar sesión">
                <IconLogout />
              </button>
            </div>
          ) : (
            <button className="sidebar-login-btn" onClick={() => setShowAuth(true)}>
              <IconUser />
              Iniciar sesión
            </button>
          )}
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="main-wrapper">
        <header className="header">
          <span className="brand">Rafita AI</span>
          {user ? (
            <div className="header-user">
              <div className="sidebar-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                {user.name[0].toUpperCase()}
              </div>
              <span className="header-user-name">{user.name}</span>
            </div>
          ) : (
            <button className="header-login-btn" onClick={() => setShowAuth(true)}>
              <IconUser />
              Iniciar sesión
            </button>
          )}
        </header>

        {messages.length === 0 ? (
          <main className="landing">
            <h1 className="headline">¿Cómo puedo hacer tu viaje inolvidable?</h1>

            <div className={`input-box${loading ? ' loading' : ''}`}>
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder={
                  !user
                    ? 'Inicia sesión para hablar con Rafita...'
                    : 'Escríbeme lo que necesitas...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={loading || !user}
              />
              <div className="input-footer">
                {!user ? (
                  <button className="send-btn-login" onClick={() => setShowAuth(true)}>
                    <IconUser />
                    Inicia sesión
                  </button>
                ) : (
                  <button
                    className="send-btn"
                    onClick={handleSubmit}
                    disabled={!input.trim() || loading}
                    aria-label="Enviar mensaje"
                  >
                    {loading
                      ? <span className="spinner" />
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                    }
                  </button>
                )}
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="modes">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={`mode-btn${activeMode === mode.id ? ' active' : ''}`}
                  onClick={() => setActiveMode(activeMode === mode.id ? null : mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </main>
        ) : (
          <>
            <div className="chat-view">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-row chat-row--${msg.role}`}>
                  {msg.role === 'rafita' && (
                    <div className="chat-avatar chat-avatar--rafita">
                      <img src="/favicon.png" alt="Rafita" />
                    </div>
                  )}
                  <div className="chat-bubble">{msg.text}</div>
                  {msg.role === 'user' && (
                    <div className="chat-avatar chat-avatar--user">
                      {user?.name[0].toUpperCase() ?? 'U'}
                    </div>
                  )}
                </div>
              ))}
              {thinking && (
                <div className="chat-row chat-row--rafita">
                  <div className="chat-avatar chat-avatar--rafita">
                    <img src="/favicon.png" alt="Rafita" />
                  </div>
                  <div className="chat-bubble chat-bubble--thinking">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-bottom">
              <div className="modes">
                {MODES.map((mode) => (
                  <button
                    key={mode.id}
                    className={`mode-btn${activeMode === mode.id ? ' active' : ''}`}
                    onClick={() => setActiveMode(activeMode === mode.id ? null : mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <div className={`input-box${loading ? ' loading' : ''}`}>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder={loading ? 'Rafita está pensando...' : 'Escríbeme lo que necesitas...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={loading}
                />
                <div className="input-footer">
                  <button
                    className="send-btn"
                    onClick={handleSubmit}
                    disabled={!input.trim() || loading}
                    aria-label="Enviar mensaje"
                  >
                    {loading
                      ? <span className="spinner" />
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                    }
                  </button>
                </div>
              </div>

              {error && <p className="error-msg">{error}</p>}
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default App
