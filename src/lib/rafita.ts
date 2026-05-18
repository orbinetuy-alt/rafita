// ── Configuración del webhook de n8n ──────────────────────────────────────
// Reemplaza esta URL con la de tu nodo Webhook en n8n
const N8N_WEBHOOK_URL = 'https://n8n.srv1035532.hstgr.cloud/webhook/rafita_app'

export interface RafitaMessage {
  message: string
  sessionId: string
  mode: string | null
  userId: string
  token: string
}

export interface RafitaResponse {
  output: string   // ajusta el campo según lo que devuelva tu agente en n8n
}

export async function sendToRafita(payload: RafitaMessage): Promise<string> {
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const rawText = await res.text()
  console.log('n8n raw response:', rawText)

  if (!res.ok) {
    throw new Error(`Error del servidor: ${res.status} — ${rawText}`)
  }

  let data: RafitaResponse
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new Error(`Respuesta no válida de n8n: ${rawText.slice(0, 200)}`)
  }

  // Si tu agente devuelve el texto en otro campo (ej: data.message, data.response)
  // cámbialo aquí:
  return data.output ?? 'Sin respuesta del agente.'
}
