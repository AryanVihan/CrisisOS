/* ── Connectivity Manager ─────────────────────────────────────
   Tracks simulated cloud / edge / degraded state. Pure data layer
   — UI subscribes via the sim hook.
*/

const listeners = new Set()
let state = {
  mode: 'cloud', // 'cloud' | 'edge' | 'degraded'
  cloudLatencyMs: 320,
  edgeLatencyMs: 12,
  lastCloudSync: Date.now(),
  offlineSinceMs: null,
  pendingSync: [],
  banner: null, // { kind, text, expires }
  syncProgress: null, // 0..1 during reconnect
  edgeDuration: 0, // seconds spent in edge mode (cumulative for current incident)
}

export function getState() {
  return state
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(state)
  return () => listeners.delete(fn)
}

function emit() {
  for (const fn of listeners) fn(state)
}

function update(patch) {
  state = { ...state, ...patch }
  emit()
}

/* ── Actions ───────────────────────────────────────────── */
export function simulateDisconnect() {
  if (state.mode === 'edge') return
  update({
    mode: 'edge',
    offlineSinceMs: Date.now(),
    cloudLatencyMs: 0,
    banner: { kind: 'amber', text: 'CLOUD CONNECTIVITY LOST — SWITCHING TO EDGE', expires: Date.now() + 5000 },
  })
}

export function simulateReconnect() {
  if (state.mode === 'cloud') return
  const queued = state.pendingSync.length
  update({
    banner: { kind: 'green', text: `CLOUD CONNECTIVITY RESTORED — SYNCING ${queued} EVENTS`, expires: Date.now() + 5000 },
    syncProgress: 0,
  })
  // Animate sync progress
  const start = Date.now()
  const dur = 3000
  const tick = () => {
    const p = Math.min(1, (Date.now() - start) / dur)
    update({ syncProgress: p })
    if (p < 1) {
      requestAnimationFrame(tick)
    } else {
      update({
        mode: 'cloud',
        cloudLatencyMs: 320,
        lastCloudSync: Date.now(),
        offlineSinceMs: null,
        pendingSync: [],
        syncProgress: null,
        banner: { kind: 'green', text: 'SYNC COMPLETE — All events logged to cloud audit trail', expires: Date.now() + 4000 },
      })
    }
  }
  requestAnimationFrame(tick)
}

export function simulateDegraded() {
  if (state.mode !== 'cloud') return
  update({
    mode: 'degraded',
    cloudLatencyMs: 2000 + Math.random() * 3000,
    banner: { kind: 'amber', text: 'DEGRADED CONNECTIVITY — EDGE FALLBACK ACTIVE', expires: Date.now() + 5000 },
  })
}

export function queueEvent(ev) {
  if (state.mode === 'edge' || state.mode === 'degraded') {
    update({ pendingSync: [...state.pendingSync, ev] })
  }
}

export function tick() {
  if (state.mode === 'edge' && state.offlineSinceMs) {
    const dur = Math.floor((Date.now() - state.offlineSinceMs) / 1000)
    if (dur !== state.edgeDuration) update({ edgeDuration: dur })
  }
  if (state.banner && state.banner.expires && Date.now() > state.banner.expires) {
    update({ banner: null })
  }
}

export function reset() {
  state = {
    mode: 'cloud',
    cloudLatencyMs: 320,
    edgeLatencyMs: 12,
    lastCloudSync: Date.now(),
    offlineSinceMs: null,
    pendingSync: [],
    banner: null,
    syncProgress: null,
    edgeDuration: 0,
  }
  emit()
}

export const SYSTEM_CHECKLIST = [
  { id: 'sensor',    label: 'Sensor monitoring',         edge: true,  cloudOnly: false },
  { id: 'anomaly',   label: 'Anomaly detection (ONNX)',  edge: true,  cloudOnly: false },
  { id: 'floormap',  label: 'Floor map tracking',        edge: true,  cloudOnly: false },
  { id: 'speaker',   label: 'Speaker control',           edge: true,  cloudOnly: false },
  { id: 'dispatch',  label: 'Staff dispatch',            edge: true,  cloudOnly: false },
  { id: 'cloudai',   label: 'Cloud AI agents',           edge: false, cloudOnly: true,  fallback: 'cached protocols' },
  { id: 'notify',    label: 'External notifications',    edge: false, cloudOnly: true,  fallback: 'queued' },
  { id: 'fed',       label: 'Multi-venue federation',    edge: false, cloudOnly: true },
]

export default {
  getState,
  subscribe,
  simulateDisconnect,
  simulateReconnect,
  simulateDegraded,
  queueEvent,
  tick,
  reset,
}
