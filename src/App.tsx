import { useState } from 'react'
import './App.css'

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

function App() {
  const [input, setInput]           = useState('')
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  // null = no autenticado
  const [user] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!input.trim()) return
    // TODO: conectar al webhook de n8n
    console.log('Enviar:', input, '| modo:', activeMode)
    setInput('')
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

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Nueva conversación */}
        <button className="sidebar-new-btn">
          <span className="sidebar-new-icon">+</span>
          Nueva conversación
        </button>

        {/* Buscador */}
        <div className="sidebar-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Recientes */}
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

        {/* Perfil / Login */}
        <div className="sidebar-footer">
          {user ? (
            <div className="sidebar-profile">
              <div className="sidebar-avatar">{user[0].toUpperCase()}</div>
              <span>{user}</span>
            </div>
          ) : (
            <button className="sidebar-login-btn">
              <IconUser />
              Iniciar sesión
            </button>
          )}
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <span className="brand">Rafita AI</span>
          <button className="header-login-btn">
            <IconUser />
            Iniciar sesión
          </button>
        </header>

        {/* Landing central */}
        <main className="landing">
          <h1 className="headline">¿Cómo puedo hacer tu viaje inolvidable?</h1>

          {/* Input box */}
          <div className="input-box">
            <textarea
              className="chat-input"
              placeholder="Escríbeme lo que necesitas..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
            />
            <div className="input-footer">
              <button
                className="send-btn"
                onClick={handleSubmit}
                disabled={!input.trim()}
                aria-label="Enviar mensaje"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modos */}
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
      </div>

    </div>
  )
}

export default App
