import React from 'react'
import { motion } from 'framer-motion'
import { useDerivedTimeline } from '../../hooks/useDerivedTimeline.js'

const INDUSTRY_AVG_SECONDS = 600 // 10 minutes — middle of "8–12 minutes"

function fmtSeconds(s) {
  if (s == null) return '— —'
  if (s < 60) return `${s.toFixed(0)} s`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

function MetricRow({ label, seconds, color }) {
  const ready = seconds != null
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ready ? color : 'bg-white/15'}`} />
        <span className="text-xs text-text-secondary truncate">{label}</span>
      </div>
      <span className={`font-mono text-sm font-semibold ${ready ? 'text-text-primary' : 'text-text-secondary opacity-60'}`}>
        {fmtSeconds(seconds)}
      </span>
    </div>
  )
}

export default function IncidentMetrics({ sim }) {
  const { milestones } = useDerivedTimeline(sim)
  const {
    firstDetection,
    aiAnalysisComplete,
    emergencyNotified,
    evacuationCommenced,
    fullAccountability,
    totalCoordinationTime,
    hasCompleted,
  } = milestones

  const total = totalCoordinationTime ?? sim.elapsedSeconds ?? 0
  const safeTotal = Math.max(total, 1)
  const improvement = Math.max(0, Math.round(((INDUSTRY_AVG_SECONDS - safeTotal) / INDUSTRY_AVG_SECONDS) * 100))

  // Bar widths — CrisisOS bar always fits, manual bar is intentionally enormous to show contrast
  const crisisBarPct = Math.min(100, (safeTotal / INDUSTRY_AVG_SECONDS) * 100)
  const manualBarPct = 100 // overflow-visible content stretches off-screen

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-bg-primary/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Incident metrics</div>
        <div className="text-sm font-semibold text-white">
          {hasCompleted ? 'Post-crisis report' : 'Live coordination metrics'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Per-stage timings */}
        <div className="rounded-xl border border-white/10 bg-bg-secondary/80 p-3">
          <MetricRow label="Time to first detection"            seconds={firstDetection}      color="bg-accent-red"   />
          <MetricRow label="Time to AI analysis complete"       seconds={aiAnalysisComplete}  color="bg-accent-blue"  />
          <MetricRow label="Time to emergency services notified" seconds={emergencyNotified}   color="bg-purple-400"   />
          <MetricRow label="Time to evacuation commenced"       seconds={evacuationCommenced} color="bg-accent-amber" />
          <MetricRow label="Time to full accountability"        seconds={fullAccountability}  color="bg-accent-green" />
        </div>

        {/* Total */}
        <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Total coordination time</div>
          <div className="mt-2 text-5xl font-bold text-accent-amber font-mono tracking-tight">
            {Math.round(total)}<span className="text-2xl ml-1 text-text-secondary">s</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {hasCompleted ? 'From first signal to all guests accounted' : 'In progress — measured from first signal'}
          </div>
        </div>

        {/* Comparison */}
        <div className="rounded-xl border border-white/10 bg-bg-secondary/80 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary mb-3">
            Industry comparison
          </div>

          {/* Manual bar — overflows the container */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">
              <span>Manual coordination (industry avg)</span>
              <span className="font-mono">8–12 min</span>
            </div>
            <div className="relative h-6 overflow-hidden rounded-md bg-white/5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${manualBarPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent-red/70 via-accent-red/50 to-accent-red/30 flex items-center justify-end pr-3"
              >
                <span className="text-[10px] font-mono text-white/90 whitespace-nowrap">→ continues off-screen</span>
              </motion.div>
            </div>
          </div>

          {/* CrisisOS bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">
              <span>CrisisOS</span>
              <span className="font-mono">{Math.round(total)}s</span>
            </div>
            <div className="relative h-6 overflow-hidden rounded-md bg-white/5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, crisisBarPct)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-gradient-to-r from-accent-green/80 to-accent-blue/70 flex items-center justify-end pr-2"
              >
                <span className="text-[10px] font-mono text-white/90 whitespace-nowrap">{Math.round(total)}s</span>
              </motion.div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent-green/10 border border-accent-green/30 px-3 py-2">
            <span className="text-accent-green text-2xl font-bold font-mono">{improvement}%</span>
            <span className="text-accent-green text-xs uppercase tracking-widest font-semibold">faster</span>
          </div>
        </div>
      </div>
    </div>
  )
}
