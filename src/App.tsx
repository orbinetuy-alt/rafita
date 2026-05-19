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

// ── Historial de conversaciones ──
interface ChatMessage { role: 'user' | 'rafita'; text: string }
interface Conversation { id: string; title: string; messages: ChatMessage[]; updatedAt: number }

const CONV_KEY = 'rafita_conversations'

function loadConversations(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(CONV_KEY) ?? '[]')
  } catch { return [] }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(CONV_KEY, JSON.stringify(convs.slice(0, 50)))
}

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

// Icono hamburguesa
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

// Icono cerrar (X)
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [thinking, setThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)

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
    const userMsg: ChatMessage = { role: 'user', text: message }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    try {
      const reply = await sendToRafita({
        message,
        sessionId: SESSION_ID,
        mode: activeMode,
        userId: user.userId,
        token: user.token,
      })
      const rafitaMsg: ChatMessage = { role: 'rafita', text: reply }
      const finalMessages = [...updatedMessages, rafitaMsg]
      setMessages(finalMessages)

      // Guardar conversación
      const isNew = !currentConvId
      const convId = currentConvId ?? (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36))
      if (isNew) setCurrentConvId(convId)
      const title = message.slice(0, 45) + (message.length > 45 ? '...' : '')
      setConversations(prev => {
        const exists = prev.find(c => c.id === convId)
        const updated: Conversation = exists
          ? { ...exists, messages: finalMessages, updatedAt: Date.now() }
          : { id: convId, title, messages: finalMessages, updatedAt: Date.now() }
        const rest = prev.filter(c => c.id !== convId)
        const next = [updated, ...rest]
        saveConversations(next)
        return next
      })
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

  const handleNewChat = () => {
    setMessages([])
    setCurrentConvId(null)
    setInput('')
    setError(null)
    setThinking(false)
    setActiveMode(null)
    setSidebarOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleLoadChat = (conv: Conversation) => {
    setMessages(conv.messages)
    setCurrentConvId(conv.id)
    setInput('')
    setError(null)
    setSidebarOpen(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50)
  }

  const filteredChats = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
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

      {/* ── Overlay sidebar mobile ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <button className="sidebar-new-btn" onClick={handleNewChat}>
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
              ? filteredChats.map((conv) => (
                  <li
                    key={conv.id}
                    className={`sidebar-chat-item${currentConvId === conv.id ? ' sidebar-chat-item--active' : ''}`}
                    onClick={() => handleLoadChat(conv)}
                  >
                    <IconChat />
                    <span>{conv.title}</span>
                  </li>
                ))
              : <li className="sidebar-empty">{conversations.length === 0 ? 'Aún no hay chats' : 'Sin resultados'}</li>
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
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
              <IconMenu />
            </button>
            <span className="brand">Rafita AI</span>
          </div>
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
