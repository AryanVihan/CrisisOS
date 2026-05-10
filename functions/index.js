import { onRequest } from 'firebase-functions/v2/https'
import { GoogleGenAI } from '@google/genai'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

function sendJson(res, status, body) {
  res.status(status).set('Content-Type', 'application/json').send(JSON.stringify(body))
}

function withCors(req, res) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return true
  }
  return false
}

export const geminiAgent = onRequest({ cors: false }, async (req, res) => {
  if (withCors(req, res)) return
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    sendJson(res, 500, { error: 'Missing GEMINI_API_KEY' })
    return
  }

  const { agent, payload } = req.body || {}
  const { system, userMessage } = payload || {}
  if (!agent || !system || !userMessage) {
    sendJson(res, 400, { error: 'Invalid request body' })
    return
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `${system}\n\n${userMessage}`,
      config: {
        temperature: 0.25,
      },
    })
    const text = (result.text || '').trim()
    if (!text) {
      sendJson(res, 502, { error: 'Empty response from Gemini' })
      return
    }
    sendJson(res, 200, { agent, text })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Gemini call failed' })
  }
})
