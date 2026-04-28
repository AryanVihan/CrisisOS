import React, { useEffect, useState, useCallback } from 'react'
import VoiceAnnouncer from '../../services/voiceAnnouncer.js'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Equalizer({ active }) {
  return (
    <div className="flex items-end gap-0.5 h-4" aria-hidden>
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          className={`w-1 rounded-sm bg-accent-blue ${active ? 'eq-bar' : ''}`}
          style={{
            height: active ? undefined : '20%',
            animationDelay: active ? `${i * 0.12}s` : undefined,
          }}
        />
      ))}
    </div>
  )
}

export default function VoicePanel() {
  const [snapshot, setSnapshot] = useState({
    enabled: VoiceAnnouncer.isEnabled(),
    speaking: false,
    currentMessage: null,
    recentLog: [],
    queueLength: 0,
  })

  useEffect(() => {
    return VoiceAnnouncer.subscribe(setSnapshot)
  }, [])

  const toggle = useCallback(() => {
    VoiceAnnouncer.setEnabled(!snapshot.enabled)
  }, [snapshot.enabled])

  const test = useCallback(() => {
    VoiceAnnouncer.speak(
      'CrisisOS speaker system is active and operational.',
      'normal',
      'system-test',
    )
  }, [])

  const current = snapshot.currentMessage

  return (
    <div className="rounded-xl border border-white/10 bg-bg-primary/70 p-3 mt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 6h2l3-3v10L5 10H3V6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="text-accent-blue"/>
            <path d="M11 5.5c.9 1 .9 4 0 5M13 4c1.6 1.7 1.6 6.3 0 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-accent-blue"/>
          </svg>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Speaker System</div>
        </div>
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
            snapshot.enabled
              ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
              : 'bg-white/5 text-text-secondary border border-white/15'
          }`}
          title="Toggle speaker output"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${snapshot.enabled ? 'bg-accent-green animate-pulse' : 'bg-text-secondary/50'}`} />
          {snapshot.enabled ? 'Active' : 'Muted'}
        </button>
      </div>

      <div className="mt-2 rounded-lg border border-white/5 bg-white/5 p-2 min-h-[58px] flex items-start gap-2">
        <Equalizer active={snapshot.speaking} />
        <div className="flex-1 min-w-0">
          {current ? (
            <>
              <div className="text-[9px] uppercase tracking-widest text-accent-blue">{current.zone}</div>
              <div className="text-[11px] text-text-primary leading-snug mt-0.5 line-clamp-3">"{current.text}"</div>
            </>
          ) : (
            <div className="text-[10px] text-text-secondary italic">Standby — no announcement live</div>
          )}
        </div>
      </div>

      {snapshot.recentLog.length > 0 && (
        <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto">
          {snapshot.recentLog.slice(0, 5).map(msg => (
            <div key={msg.id} className="flex items-start gap-1.5 text-[9px]">
              <span className="font-mono text-text-secondary shrink-0">{formatTime(msg.completedAt)}</span>
              <span className="uppercase tracking-widest text-accent-blue shrink-0">{msg.zone.slice(0, 12)}</span>
              <span className="text-text-secondary truncate">{msg.text.slice(0, 60)}…</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={test}
        className="mt-2 w-full py-1.5 rounded bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-[10px] font-semibold uppercase tracking-widest hover:bg-accent-blue/20 transition-colors"
      >
        Test Announcement
      </button>
    </div>
  )
}
