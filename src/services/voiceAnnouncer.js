// Browser-based voice announcer using Web Speech API. No external libraries.
// Provides queueing so messages do not overlap, mute persistence, and an
// observer pattern for UI panels (VoicePanel + speaker indicators).

const STORAGE_KEY = 'crisisos:voice:enabled'

const PROFILES = {
  normal:   { rate: 0.95, pitch: 1.0,  volume: 1.0 },
  calm:     { rate: 1.0,  pitch: 1.05, volume: 0.95 },
  critical: { rate: 0.85, pitch: 0.95, volume: 1.0 },
}

let voicesCache = []
let preferredVoice = null
const queue       = []
const listeners   = new Set()
const recentLog   = []
let speaking      = false
let currentMsg    = null
let initialized   = false

function readEnabled() {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === null ? true : raw === 'true'
  } catch {
    return true
  }
}

let enabled = readEnabled()

function persistEnabled(value) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, String(value)) } catch {}
}

function notify(event) {
  const snapshot = {
    enabled,
    speaking,
    currentMessage: currentMsg,
    recentLog: [...recentLog],
    queueLength: queue.length,
    event,
  }
  listeners.forEach(fn => {
    try { fn(snapshot) } catch (err) { console.warn('[voice] listener error', err) }
  })
}

function pickPreferredVoice() {
  if (!voicesCache.length) return null
  const englishFemale = voicesCache.find(v =>
    /en[-_](US|GB)/i.test(v.lang) && /female|samantha|victoria|karen|fiona|tessa|moira/i.test(v.name)
  )
  if (englishFemale) return englishFemale
  const english = voicesCache.find(v => /^en/i.test(v.lang))
  return english ?? voicesCache[0]
}

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  voicesCache = window.speechSynthesis.getVoices() || []
  if (voicesCache.length) preferredVoice = pickPreferredVoice()
}

function ensureInit() {
  if (initialized) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  initialized = true
  loadVoices()
  if (!preferredVoice) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      loadVoices()
      notify('voices-loaded')
    })
  }
}

function dequeueAndSpeak() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  if (speaking) return
  const next = queue.shift()
  if (!next) {
    currentMsg = null
    notify('idle')
    return
  }

  if (!enabled) {
    // Drop messages while muted.
    queue.length = 0
    currentMsg = null
    notify('muted-drop')
    return
  }

  const profile = PROFILES[next.priority] ?? PROFILES.normal
  const utter = new SpeechSynthesisUtterance(next.text)
  utter.rate   = profile.rate
  utter.pitch  = profile.pitch
  utter.volume = profile.volume
  if (preferredVoice) utter.voice = preferredVoice

  speaking   = true
  currentMsg = next
  notify('speaking-start')

  utter.onend = () => {
    speaking = false
    recentLog.unshift({ ...next, completedAt: Date.now() })
    if (recentLog.length > 6) recentLog.length = 6
    currentMsg = null
    notify('speaking-end')
    setTimeout(dequeueAndSpeak, 120)
  }
  utter.onerror = () => {
    speaking = false
    currentMsg = null
    notify('speaking-error')
    setTimeout(dequeueAndSpeak, 200)
  }

  try {
    window.speechSynthesis.speak(utter)
  } catch {
    speaking = false
    currentMsg = null
    notify('speaking-error')
  }
}

const VoiceAnnouncer = {
  speak(message, priority = 'normal', zone = 'all') {
    ensureInit()
    if (!message) return
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: message,
      priority,
      zone,
      queuedAt: Date.now(),
    })
    notify('enqueued')
    dequeueAndSpeak()
  },

  announceZone(zone, message, priority = 'normal') {
    const prefix = (zone === 'all' || !zone)
      ? 'Attention all guests and staff. '
      : `Attention ${zone}. `
    this.speak(prefix + message, priority, zone)
  },

  cancel() {
    queue.length = 0
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel() } catch {}
    }
    speaking   = false
    currentMsg = null
    notify('cancelled')
  },

  setEnabled(value) {
    enabled = !!value
    persistEnabled(enabled)
    if (!enabled) this.cancel()
    notify('enabled-change')
  },

  isEnabled() { return enabled },
  isSpeaking() { return speaking },
  currentMessage() { return currentMsg },
  recent() { return [...recentLog] },

  subscribe(fn) {
    listeners.add(fn)
    try {
      fn({
        enabled, speaking,
        currentMessage: currentMsg,
        recentLog: [...recentLog],
        queueLength: queue.length,
        event: 'init',
      })
    } catch {}
    return () => listeners.delete(fn)
  },
}

export default VoiceAnnouncer
