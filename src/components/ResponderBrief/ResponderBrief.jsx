import React, { useEffect, useMemo, useState } from 'react'

const recipients = ['FIRE DEPT', 'POLICE', 'AMBULANCE']

export default function ResponderBrief({ brief, rawJson }) {
  const [received, setReceived] = useState(false)

  useEffect(() => {
    setReceived(false)
    const timer = setTimeout(() => setReceived(true), 2000)
    return () => clearTimeout(timer)
  }, [brief])

  const timestamp = useMemo(() => {
    if (!brief) return ''
    if (brief.timestampGenerated && brief.timestampGenerated !== 'LIVE') return brief.timestampGenerated
    return new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [brief])

  const severityClass = brief?.severity >= 7
    ? 'text-accent-red bg-accent-red/10 border-accent-red/20'
    : brief?.severity >= 4
      ? 'text-accent-amber bg-accent-amber/10 border-accent-amber/20'
      : 'text-accent-green bg-accent-green/10 border-accent-green/20'

  const copyJson = async () => {
    if (!rawJson) return
    try {
      await navigator.clipboard.writeText(rawJson)
    } catch (error) {
      console.warn('Copy failed', error)
    }
  }

  if (!brief) {
    return (
      <div className="space-y-4 p-4 text-sm text-text-secondary">
        <div className="text-xs uppercase tracking-[0.25em] text-accent-amber">TRANSMISSION STANDBY</div>
        <div className="text-text-primary text-lg font-semibold">Awaiting Emergency Bridge brief…</div>
        <div className="rounded-xl border border-white/10 bg-bg-primary/80 p-4 text-xs">
          The first responder transmission will appear here once the coordination agent has completed its output.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 slide-up">
      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#1d1012] shadow-lg">
        <div className="flex items-center justify-between gap-4 bg-accent-red px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/80">EMERGENCY TRANSMISSION</div>
            <div className="text-sm font-semibold text-white">DISPATCHING TO FIRST RESPONDERS</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/80">ACTIVE</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {recipients.map(recipient => (
              <div key={recipient} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-white/80 flex items-center gap-2">
                <span>{recipient}</span>
                {received && <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-[9px] text-accent-green">RECEIVED</span>}
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Incident classification</div>
              <div className="text-xl font-semibold text-white">{brief.incidentType}</div>
            </div>
            <div className={`rounded-2xl border px-4 py-4 ${severityClass} border-opacity-50`}>
              <div className="text-[10px] uppercase tracking-[0.3em] text-current/70">Severity score</div>
              <div className="text-3xl font-bold">{brief.severity}/10</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-text-secondary">
                <span>📍</span> Confirmed location
              </div>
              <div className="text-sm font-semibold text-white">{brief.confirmedLocation}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Personnel impact</div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-white">{brief.estimatedPersonsAffected}</div>
                  <div className="text-text-secondary text-xs uppercase tracking-[0.2em]">Affected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-red">{brief.unaccountedPersons}</div>
                  <div className="text-text-secondary text-xs uppercase tracking-[0.2em]">Unaccounted</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Known hazards</div>
              <div className="mt-3 space-y-2">
                {brief.knownHazards?.map((hazard, idx) => (
                  <div key={idx} className="rounded-full border border-accent-red/20 bg-accent-red/5 px-3 py-2 text-xs text-accent-red">{hazard}</div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Clear access routes</div>
              <div className="mt-3 space-y-2">
                {brief.clearAccessRoutes?.map((route, idx) => (
                  <div key={idx} className="rounded-full border border-accent-green/20 bg-accent-green/5 px-3 py-2 text-xs text-accent-green">{route}</div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4 col-span-full">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Recommended entry point</div>
              <div className="mt-3 font-semibold text-white">{brief.recommendedEntryPoint}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg-primary/80 p-4 col-span-full">
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Staff contact on scene</div>
              <div className="mt-3 text-sm text-white">{brief.staffContactOnScene}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-text-secondary">Timestamp: {timestamp}</div>
            <button onClick={copyJson} className="inline-flex items-center justify-center rounded-full bg-accent-blue px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-accent-blue/90 transition-colors">
              COPY TO CLIPBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
