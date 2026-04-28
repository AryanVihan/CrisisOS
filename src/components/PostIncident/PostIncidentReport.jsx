import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useDerivedTimeline } from '../../hooks/useDerivedTimeline.js'

function fmtSeconds(s) {
  if (s == null) return '— —'
  if (s < 60) return `${Math.round(s)} s`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

function formatNow() {
  const d = new Date()
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const WHAT_WENT_WELL = [
  'Detection-to-dispatch chain triggered automatically within 28 seconds — no manual escalation required.',
  'Responder brief auto-generated and transmitted to Fire Dept and EMS before first units arrived on-site.',
  'Real-time guest accountability completed with 100 % coverage; no manual headcount needed.',
]

const PROTOCOL_GAPS = [
  'Stairwell B signage should be improved based on confusion detected at T+0:45 (3 guests reversed direction at the landing).',
  'CO₂ sensor coverage on Floor 4 west wing is sparse — recommend adding two additional units to close the gap before next drill.',
]

const TRAINING_FOCUS = [
  'Marshal handoff: practise transferring command between Coordination Agent and on-site Incident Commander once responders arrive.',
  'Floor 3 east wing micro-drills focused on Stairwell B routing and elevator lockout procedure.',
  'Concierge desk script for guest SOS escalation under degraded sensor coverage.',
]

export default function PostIncidentReport({ sim, drillMode }) {
  const { milestones, entries, auditLines } = useDerivedTimeline(sim)
  const [syncState, setSyncState] = useState('idle')

  const isComplete = milestones.hasCompleted
  const inProgress = sim.simulationStatus === 'running' || sim.simulationStatus === 'crisis'

  const summary = useMemo(() => {
    const total = milestones.totalCoordinationTime ?? sim.elapsedSeconds
    const detected = fmtSeconds(milestones.firstDetection)
    const evac = fmtSeconds(milestones.evacuationCommenced)
    const acct = fmtSeconds(milestones.fullAccountability)
    const sensorEvents = sim.incidentTimeline.length
    return `On ${formatNow()}, CrisisOS detected the incident at ${detected} after first signal and reached full guest accountability in ${fmtSeconds(total)}. Evacuation was commenced at ${evac}, with ${sensorEvents} discrete sensor events processed and ${acct} to clear the headcount. ${isComplete ? 'Incident closed without injury.' : 'Incident still in progress — figures are provisional.'}`
  }, [milestones, sim.incidentTimeline.length, sim.elapsedSeconds, sim.simulationStatus, isComplete])

  const handleSync = () => {
    setSyncState('syncing')
    setTimeout(() => {
      setSyncState('synced')
      setTimeout(() => setSyncState('idle'), 2500)
    }, 1100)
  }

  if (!inProgress && !isComplete && entries.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-bg-primary/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Post-incident report</div>
          <div className="text-sm font-semibold text-white">Awaiting first incident</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
          <div className="text-3xl mb-2 opacity-25">📄</div>
          <div className="text-xs">A summary will auto-generate once a scenario completes.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-bg-primary/80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Post-incident report</div>
          <div className="text-sm font-semibold text-white">
            {isComplete ? 'Incident closed — final report' : 'Provisional report (live)'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {drillMode && (
            <span className="px-2 py-1 rounded-full bg-accent-amber/20 border border-accent-amber/40 text-accent-amber text-[10px] font-mono uppercase tracking-widest">
              Drill record
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncState !== 'idle'}
            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-colors border ${
              syncState === 'synced'
                ? 'bg-accent-green/15 border-accent-green/40 text-accent-green'
                : syncState === 'syncing'
                ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                : 'bg-white/10 border-white/15 text-text-primary hover:bg-white/15'
            }`}
          >
            {syncState === 'synced' ? 'Synced ✓' : syncState === 'syncing' ? 'Syncing…' : 'Sync to Training Database'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Incident summary</div>
          <p className="mt-2 text-sm text-text-primary leading-relaxed">{summary}</p>
        </motion.div>

        {/* Metrics table */}
        <div className="rounded-xl border border-white/10 bg-bg-secondary/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Key metrics</div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Time to first detection',           fmtSeconds(milestones.firstDetection)],
                ['Time to AI analysis complete',      fmtSeconds(milestones.aiAnalysisComplete)],
                ['Time to emergency services notified', fmtSeconds(milestones.emergencyNotified)],
                ['Time to evacuation commenced',      fmtSeconds(milestones.evacuationCommenced)],
                ['Time to full accountability',       fmtSeconds(milestones.fullAccountability)],
                ['Total coordination time',           fmtSeconds(milestones.totalCoordinationTime)],
                ['Discrete sensor events processed',  String(sim.incidentTimeline.length)],
                ['Total audit log lines',             String(auditLines.length)],
              ].map(([label, value], idx) => (
                <tr key={label} className={`border-t border-white/5 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="px-4 py-2 text-text-secondary">{label}</td>
                  <td className="px-4 py-2 font-mono text-text-primary text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Two-column qualitative analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-accent-green/25 bg-accent-green/5 p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-accent-green">What went well</div>
            <ul className="mt-2 space-y-2">
              {WHAT_WENT_WELL.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-text-primary leading-snug">
                  <span className="text-accent-green shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-accent-amber/25 bg-accent-amber/5 p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-accent-amber">Protocol gaps identified</div>
            <ul className="mt-2 space-y-2">
              {PROTOCOL_GAPS.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-text-primary leading-snug">
                  <span className="text-accent-amber shrink-0">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Training focus */}
        <div className="rounded-xl border border-accent-blue/25 bg-accent-blue/5 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-accent-blue">Recommended training focus</div>
          <ul className="mt-2 space-y-2">
            {TRAINING_FOCUS.map((item) => (
              <li key={item} className="flex gap-2 text-xs text-text-primary leading-snug">
                <span className="text-accent-blue shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-[10px] text-text-secondary text-center opacity-70">
          Report generated automatically by CrisisOS post-incident learning loop · feeds back into staff training & sensor coverage planning.
        </div>
      </div>
    </div>
  )
}
