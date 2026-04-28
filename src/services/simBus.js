// Cross-tab simulation bus.
// The main dashboard publishes simulation snapshots; the /guest and /staff
// tabs subscribe and can also send actions back (SOS, "I am safe", etc).
//
// Uses BroadcastChannel where available, with a localStorage fallback so
// the second tab opens reliably even on older browsers / privacy modes.

const CHANNEL_NAME = 'crisisos-bus'
const STORAGE_KEY  = 'crisisos:bus:lastEvent'
const STATE_KEY    = 'crisisos:bus:state'

let channel = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
} catch {
  channel = null
}

const listeners = new Set()
let cachedState  = null

function readPersistedState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

cachedState = readPersistedState()

function emit(message) {
  listeners.forEach(fn => {
    try { fn(message) } catch (err) { console.warn('[simBus] listener error', err) }
  })
}

function handleIncoming(message) {
  if (!message || typeof message !== 'object') return
  if (message.type === 'state') {
    cachedState = message.payload
  }
  emit(message)
}

if (channel) {
  channel.addEventListener('message', (e) => handleIncoming(e.data))
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { handleIncoming(JSON.parse(e.newValue)) } catch {}
    }
    if (e.key === STATE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue)
        cachedState = parsed
        emit({ type: 'state', payload: parsed })
      } catch {}
    }
  })
}

export const simBus = {
  publish(message) {
    if (!message) return
    if (channel) {
      try { channel.postMessage(message) } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...message, _at: Date.now() })
        )
      } catch {}
    }
    handleIncoming(message)
  },
  publishState(snapshot) {
    cachedState = snapshot
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(STATE_KEY, JSON.stringify(snapshot)) } catch {}
    }
    this.publish({ type: 'state', payload: snapshot })
  },
  subscribe(fn) {
    listeners.add(fn)
    if (cachedState) {
      try { fn({ type: 'state', payload: cachedState }) } catch {}
    }
    return () => listeners.delete(fn)
  },
  getState() {
    return cachedState ?? readPersistedState()
  },
  clearState() {
    cachedState = null
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(STATE_KEY) } catch {}
    }
  },
}

export default simBus
