import { useState } from 'react'
import { apiLogin, apiRegister, saveUser, type RafitaUser } from '../lib/auth'

interface Props {
  onSuccess: (user: RafitaUser) => void
  onClose: () => void
}

export default function AuthModal({ onSuccess, onClose }: Props) {
  const [tab, setTab]         = useState<'login' | 'register'>('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const reset = () => { setError(null); setName(''); setEmail(''); setPassword('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = tab === 'login'
        ? await apiLogin(email, password)
        : await apiRegister(name, email, password)
      saveUser(user)
      onSuccess(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); reset() }}
          >
            Iniciar sesión
          </button>
          <button
            className={`modal-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); reset() }}
          >
            Registrarse
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name">Nombre</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-submit" disabled={loading}>
            {loading
              ? <span className="spinner" />
              : tab === 'login' ? 'Entrar' : 'Crear cuenta'
            }
          </button>
        </form>

      </div>
    </div>
  )
}
