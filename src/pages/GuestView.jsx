import React, { useEffect, useState } from 'react'
import simBus from '../services/simBus.js'

const PHONE_W = 375
const PHONE_H = 750

function formatTimeShort(d) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

function StatusBar({ time }) {
  return (
    <div className="flex items-center justify-between px-6 py-2 text-[12px] text-white">
      <span className="font-semibold">{time}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-white/70 text-[10px]">5G</span>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
          <rect x="1" y="6" width="2.5" height="3" rx="0.5" fill="white"/>
          <rect x="4.5" y="4" width="2.5" height="5" rx="0.5" fill="white"/>
          <rect x="8" y="2" width="2.5" height="7" rx="0.5" fill="white"/>
          <rect x="11.5" y="0" width="2" height="9" rx="0.5" fill="white" opacity="0.5"/>
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="white"/>
          <rect x="2" y="2" width="13" height="6" rx="1" fill="white"/>
          <rect x="20" y="3" width="2" height="4" rx="1" fill="white"/>
        </svg>
      </div>
    </div>
  )
}

function PhoneFrame({ children }) {
  return (
    <div
      className="relative mx-auto rounded-[40px] border-[10px] border-neutral-900 shadow-2xl bg-black overflow-hidden"
      style={{ width: PHONE_W + 20, height: PHONE_H + 20 }}
    >
      {/* Notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 rounded-b-2xl bg-black z-30 pointer-events-none" />
      <div className="relative w-full h-full overflow-hidden rounded-[30px]">
        {children}
      </div>
    </div>
  )
}

function NormalState({ time, room, onSos }) {
  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white">
      <StatusBar time={time} />
      <div className="px-6 pt-2 pb-4 border-b border-white/10">
        <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300/80">Horizon Grand</div>
        <div className="text-lg font-semibold">Guest Services</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">{room}</div>
          <div className="text-[11px] text-white/60">Welcome back</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        <div className="text-[12px] text-white/60">Quick links</div>
        {[
          { label: 'Room Service',  desc: '24-hour menu · order to your door' },
          { label: 'Concierge',     desc: 'Reservations, transit, tips' },
          { label: 'Express Checkout', desc: 'Settle your stay from your phone' },
          { label: 'Spa & Pool',    desc: 'Hours · bookings · floor map' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 active:scale-[0.99] transition">
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="text-[11px] text-white/55 mt-0.5">{item.desc}</div>
          </div>
        ))}
        <div className="text-[11px] text-white/40 text-center pt-3">Tap below in any emergency</div>
      </div>
      <div className="border-t border-white/10 p-4 bg-black/60 backdrop-blur">
        <button
          onClick={onSos}
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold tracking-widest text-base shadow-[0_8px_24px_rgba(239,68,68,0.5)] transition"
        >
          🚨 SOS · EMERGENCY
        </button>
      </div>
    </div>
  )
}

function CrisisState({ time, severity, evacuationActive, room, onSafe, onHelp, safeConfirmed, helpRequested, recentEvent, accountedGuests }) {
  const isFullEmergency = severity >= 7
  const palette = isFullEmergency ? {
    bg: 'from-red-700 via-red-800 to-black',
    accent: 'bg-red-500',
  } : {
    bg: 'from-amber-600 via-amber-800 to-black',
    accent: 'bg-amber-500',
  }
  return (
    <div className={`h-full w-full flex flex-col bg-gradient-to-br ${palette.bg} text-white`}>
      <StatusBar time={time} />
      <div className="px-5 pt-3 pb-3 border-b border-white/15 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/80">Horizon Grand</div>
          <div className="text-sm font-semibold">{room}</div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${palette.accent} text-white animate-pulse`}>
          Live
        </span>
      </div>
      <div className="px-5 py-5 space-y-4 overflow-y-auto flex-1">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/70">Status</div>
          <div className="text-3xl font-extrabold tracking-tight mt-1 animate-pulse">EMERGENCY IN PROGRESS</div>
          <div className="text-[12px] text-white/80 mt-1">You are on Floor 3</div>
        </div>

        <div className="rounded-2xl bg-black/30 border border-white/15 p-4">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/70">Action required</div>
          <div className="mt-1 text-base font-bold leading-snug">
            EVACUATE IMMEDIATELY — Use Stairwell A (turn left from your room).
          </div>
          <div className="text-[12px] text-white/80 mt-2 leading-relaxed">
            Do <span className="font-bold">NOT</span> use elevators. Staff are guiding you.
          </div>
        </div>

        <div className="rounded-2xl bg-black/30 border border-white/10 p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/60">Live status</div>
          <div className="mt-1 text-[12px] leading-relaxed text-white/90">
            Emergency services have been notified. ETA: 3 minutes.
          </div>
          <div className="mt-2 text-[11px] text-white/70">
            Accounted: {accountedGuests} / 251 guests
          </div>
        </div>

        {recentEvent && (
          <div className="rounded-xl bg-black/40 border border-white/10 px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-white/60">Live update</div>
            <div className="text-[11px] text-white/90 mt-0.5 leading-snug">
              {recentEvent.message?.slice(0, 110) ?? 'Crisis update streaming…'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            disabled={safeConfirmed}
            onClick={onSafe}
            className={`py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition ${
              safeConfirmed
                ? 'bg-emerald-600/40 text-emerald-100 border border-emerald-300/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg'
            }`}
          >
            {safeConfirmed ? '✓ Confirmed Safe' : 'Tap to Confirm You Are Safe'}
          </button>
          <button
            disabled={helpRequested}
            onClick={onHelp}
            className={`py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition ${
              helpRequested
                ? 'bg-white/10 text-white/70 border border-white/15'
                : 'bg-white text-red-700 hover:bg-white/90'
            }`}
          >
            {helpRequested ? 'Help requested — staff dispatched' : 'I Need Assistance'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResolvedState({ time, room, severity }) {
  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-emerald-700 via-emerald-900 to-black text-white">
      <StatusBar time={time} />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-300 flex items-center justify-center mb-4">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-2xl font-extrabold tracking-tight">YOU ARE SAFE</div>
        <div className="text-[12px] text-white/80 mt-2 max-w-[260px]">
          Thank you for following hotel emergency procedures. Please remain at the assembly point until staff dismiss you.
        </div>
        <div className="mt-6 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-[11px] text-white/80">
          Incident reference · CRX-{String(Math.floor(Date.now() / 1000)).slice(-6)}
        </div>
        <div className="mt-6 text-[11px] text-white/70">{room} · {severity ? `severity ${severity.toFixed(1)} resolved` : 'all clear'}</div>
        <div className="mt-8 w-full">
          <div className="text-[10px] uppercase tracking-widest text-white/60 mb-2">Your feedback helps us improve</div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-base">★</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GuestView() {
  const initialState = simBus.getState() ?? {}
  const [sim, setSim] = useState(initialState)
  const [time, setTime] = useState(formatTimeShort(new Date()))
  const [safeConfirmed, setSafeConfirmed] = useState(false)
  const [helpRequested, setHelpRequested] = useState(false)
  const [room] = useState('Room 312')
  const floor = 'Floor 3'

  useEffect(() => {
    const id = setInterval(() => setTime(formatTimeShort(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return simBus.subscribe((msg) => {
      if (msg.type === 'state') setSim(msg.payload)
    })
  }, [])

  // Reset acknowledgements when sim resets
  useEffect(() => {
    if (sim.simulationStatus === 'idle' || !sim.simulationStatus) {
      setSafeConfirmed(false)
      setHelpRequested(false)
    }
  }, [sim.simulationStatus])

  const severity = sim.severityScore ?? 0
  const isCrisis = (sim.evacuationActive || severity >= 4) && sim.simulationStatus !== 'idle'
  const isResolved = sim.simulationStatus === 'crisis' && (sim.accountedGuests ?? 0) >= 251 && (sim.elapsedSeconds ?? 0) >= 75
  const recentEvent = sim.lastEvent

  const sendSos = () => {
    simBus.publish({
      type: 'action',
      payload: { kind: 'guest-sos', floor, room },
    })
  }
  const sendSafe = () => {
    setSafeConfirmed(true)
    simBus.publish({
      type: 'action',
      payload: { kind: 'guest-safe', label: `${room} guest` },
    })
  }
  const sendHelp = () => {
    setHelpRequested(true)
    simBus.publish({
      type: 'action',
      payload: { kind: 'guest-help', info: { room, floor } },
    })
  }

  let body
  if (isResolved) {
    body = <ResolvedState time={time} room={room} severity={severity} />
  } else if (isCrisis) {
    body = (
      <CrisisState
        time={time}
        severity={severity}
        evacuationActive={sim.evacuationActive}
        room={room}
        onSafe={sendSafe}
        onHelp={sendHelp}
        safeConfirmed={safeConfirmed}
        helpRequested={helpRequested}
        recentEvent={recentEvent}
        accountedGuests={sim.accountedGuests ?? 251}
      />
    )
  } else {
    body = <NormalState time={time} room={room} onSos={sendSos} />
  }

  return (
    <div className="min-h-screen w-full bg-bg-primary py-8 flex flex-col items-center justify-center">
      <div className="text-text-secondary text-xs uppercase tracking-[0.3em] mb-3">CrisisOS · Guest Mobile View</div>
      <PhoneFrame>{body}</PhoneFrame>
      <div className="mt-4 text-[11px] text-text-secondary max-w-md text-center">
        This screen is what guests see on their phones. It auto-syncs with the main dashboard. Tap SOS or "I'm safe" to feed events back into the simulation.
      </div>
    </div>
  )
}
