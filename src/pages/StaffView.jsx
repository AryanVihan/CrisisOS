import React, { useEffect, useMemo, useState } from 'react'
import simBus from '../services/simBus.js'

const PHONE_W = 375
const PHONE_H = 750

function formatTimeShort(d) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

function PhoneFrame({ children }) {
  return (
    <div
      className="relative mx-auto rounded-[40px] border-[10px] border-neutral-900 shadow-2xl bg-black overflow-hidden"
      style={{ width: PHONE_W + 20, height: PHONE_H + 20 }}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 rounded-b-2xl bg-black z-30 pointer-events-none" />
      <div className="relative w-full h-full overflow-hidden rounded-[30px] bg-bg-primary">
        {children}
      </div>
    </div>
  )
}

const STAFF_PROFILE = {
  name: 'Marcus Reid',
  role: 'Security',
  zone: 'Floor 3 · East Wing',
}

const STATUS_OPTIONS = ['En Route', 'On Scene', 'Zone Clear']

export default function StaffView() {
  const initialState = simBus.getState() ?? {}
  const [sim, setSim] = useState(initialState)
  const [time, setTime] = useState(formatTimeShort(new Date()))
  const [status, setStatus] = useState('En Route')
  const [pinged, setPinged] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTime(formatTimeShort(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return simBus.subscribe((msg) => {
      if (msg.type === 'state') setSim(msg.payload)
    })
  }, [])

  const isCrisis = sim.simulationStatus && sim.simulationStatus !== 'idle'
  const guestsInZone = useMemo(() => {
    if (!isCrisis) return 0
    return Math.max(8, Math.floor((sim.accountedGuests ?? 0) * 0.07))
  }, [sim.accountedGuests, isCrisis])

  const ping = () => {
    setPinged(true)
    simBus.publish({
      type: 'action',
      payload: { kind: 'guest-help', info: { room: STAFF_PROFILE.zone, floor: 'Floor 3', source: 'staff-radio' } },
    })
    setTimeout(() => setPinged(false), 1800)
  }

  return (
    <div className="min-h-screen w-full bg-bg-primary py-8 flex flex-col items-center justify-center">
      <div className="text-text-secondary text-xs uppercase tracking-[0.3em] mb-3">CrisisOS · Staff Mobile View</div>
      <PhoneFrame>
        <div className="h-full w-full flex flex-col text-text-primary">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-bg-secondary">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Crisis OS · Field</div>
              <div className="text-base font-semibold">{STAFF_PROFILE.name}</div>
              <div className="text-[11px] text-text-secondary">{STAFF_PROFILE.role}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-secondary">{time}</div>
              <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isCrisis ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-green/20 text-accent-green'
              }`}>
                {isCrisis ? 'Crisis' : 'Standby'}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-bg-secondary p-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Current assignment</div>
              <div className="text-base font-semibold mt-1">
                {isCrisis
                  ? 'Guide guests via Stairwell A. Sweep east-wing rooms 308–315.'
                  : 'Patrol your assigned zone. Await dispatch.'}
              </div>
              <div className="text-[11px] text-text-secondary mt-1.5">{STAFF_PROFILE.zone}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-bg-secondary p-3">
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">Guests in zone</div>
                <div className="text-2xl font-bold text-accent-blue tabular-nums">{guestsInZone}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-bg-secondary p-3">
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">Total accounted</div>
                <div className={`text-2xl font-bold tabular-nums ${
                  (sim.accountedGuests ?? 251) < 251 ? 'text-accent-amber' : 'text-accent-green'
                }`}>{sim.accountedGuests ?? 251}/251</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary mb-2">Status update</div>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setStatus(opt)}
                    className={`py-2 rounded-lg text-[11px] font-semibold uppercase tracking-widest transition ${
                      status === opt
                        ? 'bg-accent-blue text-white'
                        : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-text-secondary mt-2">
                Reporting: <span className="text-accent-blue font-semibold">{status}</span>
              </div>
            </div>

            {sim.lastEvent && (
              <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">Latest dispatch</div>
                <div className="text-[11px] text-text-primary mt-1 leading-snug">
                  {sim.lastEvent.message?.slice(0, 130) ?? '—'}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4 bg-bg-secondary">
            <button
              onClick={ping}
              className={`w-full py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition ${
                pinged ? 'bg-accent-green text-black' : 'bg-accent-red hover:bg-accent-red/90 text-white'
              }`}
            >
              {pinged ? '✓ Command Notified' : '☎ Direct Comms — Command'}
            </button>
          </div>
        </div>
      </PhoneFrame>
      <div className="mt-4 text-[11px] text-text-secondary max-w-md text-center">
        Staff field view — auto-synced with the main dashboard's dispatch board.
      </div>
    </div>
  )
}
