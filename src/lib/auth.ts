// ── Endpoints de autenticación en n8n ─────────────────────────────────────
const BASE = 'https://n8n.srv1035532.hstgr.cloud'
const REGISTER_URL = `${BASE}/webhook/rafita_register`
const LOGIN_URL    = `${BASE}/webhook/rafita_login`

const STORAGE_KEY = 'rafita_user'

export interface RafitaUser {
  userId: string
  name: string
  email: string
  token: string
}

// ── Persistencia ───────────────────────────────────────────────────────────
export function saveUser(user: RafitaUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function loadUser(): RafitaUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as RafitaUser }
  catch { return null }
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ── API calls ──────────────────────────────────────────────────────────────
export async function apiRegister(
  name: string,
  email: string,
  password: string,
): Promise<RafitaUser> {
  const res = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error al registrarse')
  return data as RafitaUser
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<RafitaUser> {
  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Email o contraseña incorrectos')
  return data as RafitaUser
}
