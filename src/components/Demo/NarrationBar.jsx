import React, { useEffect, useState } from 'react'

const NARRATION_BEATS = [
  { from: 0,  to: 5,  text: 'A normal evening at the Horizon Grand. Sensors are quiet, staff are on patrol, 251 guests are checked in.' },
  { from: 6,  to: 11, text: 'A grease fire ignites in the Floor 3 east-wing kitchen. Temperature spikes from 22°C to over 300°C in seconds.' },
  { from: 12, to: 17, text: 'CrisisOS detects the thermal anomaly. The Sensor Monitor agent flags it; the Threat Assessor confirms a fire.' },
  { from: 18, to: 24, text: 'Severity crosses critical. Evacuation begins. Per-zone voice broadcasts go out — different message to Floor 3 vs the lobby.' },
  { from: 25, to: 39, text: 'A guest in Room 312 sends an SOS. The CCTV vision agent picks up bottlenecks at the north stairwell.' },
  { from: 40, to: 59, text: 'Specialized agents coordinate: dispatch, evacuation routing, and emergency-services bridge — all in parallel.' },
  { from: 60, to: 74, text: 'Heat begins migrating to Floor 4. The system pre-emptively expands the evacuation perimeter.' },
  { from: 75, to: 999, text: 'All 251 guests accounted for. Crisis controlled in under 90 seconds — vs the industry average of 8–12 minutes.' },
]

const PLAY_PAUSE = {
  playing: { label: 'PAUSE', icon: '❚❚' },
  paused:  { label: 'PLAY',  icon: '▶' },
}

export default function NarrationBar({ visible, sim }) {
  const [paused, setPaused]   = useState(false)
  const [muted, setMuted]     = useState(false)
  if (!visible) return null

  const t   = sim.elapsedSeconds
  const beat = NARRATION_BEATS.find(b => t >= b.from && t <= b.to) ?? NARRATION_BEATS[0]
  const pct = Math.min(100, (t / 90) * 100)

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-3 z-[55] w-[min(880px,90vw)] rounded-2xl border border-white/10 bg-bg-secondary/95 backdrop-blur shadow-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-purple-300 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Narration
        </div>
        <div className="flex-1 text-[12.5px] text-text-primary leading-snug">
          {beat.text}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setPaused(p => !p)}
            title={paused ? 'Resume' : 'Pause'}
            className="px-2 py-1 rounded text-[11px] bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10"
          >
            {paused ? PLAY_PAUSE.paused.icon : PLAY_PAUSE.playing.icon}
          </button>
          <button
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Unmute' : 'Mute'}
            className="px-2 py-1 rounded text-[11px] bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10"
          >
            {muted ? '🔈' : '🔊'}
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="font-mono text-[10px] text-text-secondary tabular-nums shrink-0">T+{String(Math.floor(t/60)).padStart(2,'0')}:{String(t%60).padStart(2,'0')}</div>
        <div className="flex-1 h-1.5 rounded bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-amber via-accent-red to-purple-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="font-mono text-[10px] text-text-secondary shrink-0">90s</div>
      </div>
    </div>
  )
}
