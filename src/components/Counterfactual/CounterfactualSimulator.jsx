import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/* ── Scenarios data ──────────────────────────────────────────── */
const SCENARIOS = [
  {
    id: 'A',
    title: 'Stairwell A also blocked',
    question: 'What if Stairwell A was also blocked?',
    summary: 'Loss of primary north evacuation route forces full reroute through south corridors and Stairwell B.',
    deltas: [
      { label: 'Evacuation time',     baseline: 75, projected: 75 + 192, unit: 's', direction: 'worse' },
      { label: 'Risk score',          baseline: 100, projected: 140,    unit: '%', direction: 'worse' },
      { label: 'Guests at risk',      baseline: 0,   projected: 12,     unit: '',  direction: 'worse' },
    ],
    visual: 'stairwell-a-blocked',
    insight: 'CrisisOS auto-rerouted 92 % of guests via Stairwell B and exit EX-04 within 4 seconds of the obstruction being detected.',
  },
  {
    id: 'B',
    title: 'Crisis at peak dinner service',
    question: 'What if the crisis started 30 minutes later (peak dinner, +80 guests)?',
    summary: 'Higher guest density in lobby, ballroom and bar lounge increases tracking complexity and required staff bandwidth.',
    deltas: [
      { label: 'Accountability complexity', baseline: 100, projected: 132, unit: '%', direction: 'worse' },
      { label: 'Coordination time',         baseline: 75,  projected: 120, unit: 's', direction: 'worse' },
      { label: 'Additional staff required', baseline: 0,   projected: 3,   unit: '',  direction: 'worse' },
    ],
    visual: 'peak-load',
    insight: 'CrisisOS dynamically promotes 3 housekeeping staff to evacuation marshals and reweights AI accountability sweeps.',
  },
  {
    id: 'C',
    title: 'Detection system offline',
    question: 'What if the detection system was offline?',
    summary: 'Reverts to manual coordination — the same baseline as the "Without CrisisOS" comparison.',
    deltas: [
      { label: 'Time to first detection',  baseline: 3,  projected: 150,  unit: 's', direction: 'worse' },
      { label: 'Coordination time',        baseline: 75, projected: 1080, unit: 's', direction: 'worse' },
      { label: 'Projected injuries',       baseline: 0,  projected: 2,    unit: '',  direction: 'worse' },
    ],
    visual: 'manual-fallback',
    insight: 'Without sensor coverage, response collapses to phone-tree coordination. CrisisOS maintains live failover guidance for these cases.',
  },
]

/* ── Visualization swatches ──────────────────────────────────── */
function MiniMap({ visual, running }) {
  /* A simplified, abstract floor diagram. Different visuals highlight different alterations. */
  const stairAColor = visual === 'stairwell-a-blocked' && running ? '#ef4444' : '#22c55e'
  const guestDensity = visual === 'peak-load' && running ? 24 : 12
  const sensorPulse = visual === 'manual-fallback' && running ? 0.15 : 1

  return (
    <svg viewBox="0 0 200 120" className="w-full h-32 rounded-lg bg-bg-primary/70 border border-white/10">
      {/* Building outline */}
      <rect x="10" y="10" width="180" height="100" rx="3" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      {/* Stair A (left) */}
      <rect x="14" y="14" width="20" height="92" rx="2" fill={stairAColor} fillOpacity="0.2" stroke={stairAColor} strokeWidth="1.2">
        {visual === 'stairwell-a-blocked' && running && (
          <animate attributeName="fill-opacity" values="0.2;0.5;0.2" dur="1s" repeatCount="indefinite"/>
        )}
      </rect>
      <text x="24" y="60" textAnchor="middle" fontSize="6" fill={stairAColor} fontFamily="monospace">A</text>
      {/* Stair B (right) */}
      <rect x="166" y="14" width="20" height="92" rx="2" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.2"/>
      <text x="176" y="60" textAnchor="middle" fontSize="6" fill="#22c55e" fontFamily="monospace">B</text>
      {/* Corridor */}
      <line x1="34" y1="60" x2="166" y2="60" stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="2 2"/>

      {/* Evacuation routes */}
      {visual === 'stairwell-a-blocked' && running ? (
        <>
          <path d="M40 40 Q100 15 160 40" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeDasharray="4 2">
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1s" repeatCount="indefinite"/>
          </path>
          <path d="M40 80 Q100 105 160 80" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeDasharray="4 2">
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1s" repeatCount="indefinite"/>
          </path>
        </>
      ) : (
        <>
          <path d="M40 50 L70 50" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
          <path d="M130 50 L160 50" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
        </>
      )}

      {/* Guests */}
      {Array.from({ length: guestDensity }).map((_, i) => {
        const cx = 40 + (i % 8) * 16 + ((i % 2) * 4)
        const cy = 75 + Math.floor(i / 8) * 10
        return <circle key={i} cx={cx} cy={cy} r="1.4" fill="#3b82f6" opacity={0.7}/>
      })}

      {/* Sensors (dimmed if offline) */}
      <g opacity={sensorPulse}>
        <circle cx="60" cy="30" r="1.8" fill="#f59e0b"/>
        <circle cx="100" cy="30" r="1.8" fill="#f59e0b"/>
        <circle cx="140" cy="30" r="1.8" fill="#f59e0b"/>
      </g>
    </svg>
  )
}

/* ── Single scenario card ────────────────────────────────────── */
function ScenarioCard({ scenario, runningId, onRun }) {
  const isRunning = runningId === scenario.id
  return (
    <motion.div
      layout
      className={`flex flex-col rounded-2xl border ${isRunning ? 'border-accent-amber/50 bg-accent-amber/5' : 'border-white/10 bg-bg-secondary/80'} p-4 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">
            Scenario {scenario.id}
          </div>
          <div className="text-sm font-semibold text-white mt-0.5">{scenario.title}</div>
        </div>
        <span className={`text-[9px] px-2 py-1 rounded-full font-mono uppercase tracking-widest ${
          isRunning ? 'bg-accent-amber/20 text-accent-amber' : 'bg-white/10 text-text-secondary'
        }`}>
          {isRunning ? 'Running' : 'Standby'}
        </span>
      </div>

      <p className="mt-2 text-xs text-text-secondary leading-snug">{scenario.question}</p>

      <div className="mt-3">
        <MiniMap visual={scenario.visual} running={isRunning} />
      </div>

      <div className="mt-3 space-y-2">
        {scenario.deltas.map((d) => {
          const baseline = Math.max(d.baseline, 1)
          const max = Math.max(baseline, d.projected, 1)
          return (
            <div key={d.label}>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-secondary">
                <span>{d.label}</span>
                <span className="font-mono text-text-primary">
                  {d.baseline}{d.unit} → <span className="text-accent-red">{d.projected}{d.unit}</span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/5 overflow-hidden flex gap-px">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(baseline / max) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-emerald-500/70"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isRunning ? `${(d.projected / max) * 100}%` : `${(d.projected / max) * 50}%` }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="h-full bg-rose-500/70"
                />
              </div>
            </div>
          )
        })}
      </div>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-3 py-2 text-[11px] text-accent-amber leading-snug"
        >
          {scenario.insight}
        </motion.div>
      )}

      <button
        onClick={() => onRun(scenario.id)}
        disabled={isRunning}
        className={`mt-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors ${
          isRunning
            ? 'bg-accent-amber/15 text-accent-amber cursor-not-allowed'
            : 'bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25'
        }`}
      >
        {isRunning ? 'Simulating…' : 'Run Simulation'}
      </button>
    </motion.div>
  )
}

/* ── Main component ──────────────────────────────────────────── */
export default function CounterfactualSimulator() {
  const [runningId, setRunningId] = useState(null)

  const handleRun = (id) => {
    setRunningId(id)
    setTimeout(() => setRunningId(null), 4500)
  }

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-bg-primary/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Counterfactual simulator</div>
        <div className="text-sm font-semibold text-white">What-if analysis · predictive engine</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {SCENARIOS.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                runningId={runningId}
                onRun={handleRun}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="rounded-xl border border-accent-blue/25 bg-accent-blue/5 px-4 py-3 text-center">
          <div className="text-accent-blue text-xs font-semibold leading-snug">
            CrisisOS adapts the response plan in real time to any configuration. These results are computed by our predictive engine.
          </div>
        </div>
      </div>
    </div>
  )
}
