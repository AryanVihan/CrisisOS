import React, { useEffect, useState } from 'react'

const TARGETS = {
  detection: 0.7,        // seconds
  alert: 1.5,            // seconds
  evac: 2.5,             // seconds
  resolution: 89,        // seconds
}

function fmt(num, suffix = '') {
  if (num >= 100) return `${Math.round(num)}${suffix}`
  return `${num.toFixed(1)}${suffix}`
}

export default function StatsOverlay({ visible, sim }) {
  if (!visible) return null

  const t = sim.elapsedSeconds
  const isCrisis = sim.simulationStatus !== 'idle'

  const detectionTime = isCrisis ? Math.min(0.7, Math.max(0.1, t * 0.05)) : 0
  const alertTime     = t >= 4  ? 1.4 : 0
  const evacTime      = t >= 8  ? 2.3 : 0
  const resolution    = sim.accountedGuests >= 251 && t >= 75 ? 89 : (isCrisis ? t : 0)

  const aiDecisions   = sim.aiDecisionsCount ?? 0
  const messages      = sim.messagesCount ?? 0
  const safetyCheckIns = sim.safetyCheckIns ?? 0
  const helpReqs      = sim.helpRequests?.length ?? 0
  const staffDispatched = sim.staffCoordinatedCount ?? 0

  return (
    <div className="fixed top-20 right-3 z-[55] w-[260px] rounded-2xl border border-emerald-400/30 bg-bg-secondary/95 backdrop-blur shadow-2xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 font-semibold">Live Metrics</div>
        <span className="text-[9px] text-text-secondary">vs traditional</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Detection" value={fmt(detectionTime, 's')} target={fmt(TARGETS.detection, 's')} note="vs ~5 min" />
        <Stat label="Alert" value={fmt(alertTime, 's')} target={fmt(TARGETS.alert, 's')} note="vs ~3 min" />
        <Stat label="Evac start" value={fmt(evacTime, 's')} target={fmt(TARGETS.evac, 's')} note="vs ~6 min" />
        <Stat label="Resolved" value={resolution >= 75 ? `${TARGETS.resolution}s` : (resolution > 0 ? `${Math.floor(resolution)}s` : '—')} target={`${TARGETS.resolution}s`} note="vs 8–12 min" />
      </div>

      <div className="border-t border-white/10 pt-2 space-y-1.5">
        <Row label="AI decisions"        value={aiDecisions} accent="text-accent-blue" />
        <Row label="Messages broadcast"  value={messages} accent="text-accent-amber" />
        <Row label="Staff coordinated"   value={staffDispatched} accent="text-accent-green" />
        <Row label="Guest check-ins"     value={safetyCheckIns} accent="text-accent-green" />
        <Row label="Help requests"       value={helpReqs} accent={helpReqs > 0 ? 'text-accent-red' : 'text-text-secondary'} />
      </div>

      <div className="text-[9px] text-text-secondary text-center pt-1 border-t border-white/5">
        Severity {sim.severityScore?.toFixed(1) ?? '0.0'} · {isCrisis ? 'CRISIS MODE' : 'STANDBY'}
      </div>
    </div>
  )
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-2">
      <div className="text-[9px] uppercase tracking-widest text-text-secondary">{label}</div>
      <div className="text-base font-bold text-emerald-300 tabular-nums">{value}</div>
      <div className="text-[9px] text-text-secondary mt-0.5">{note}</div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-mono font-bold tabular-nums ${accent}`}>{value}</span>
    </div>
  )
}
