import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RISK_LEVEL_COLOR, PRE_ACTIONS } from '../../services/riskPredictor.js'
import FloorRiskHeatmap from './FloorRiskHeatmap.jsx'

function Sparkline({ data, color = '#3b82f6', height = 36 }) {
  if (!data || data.length < 2) return null
  const max = 100
  const min = 0
  const w = 200
  const step = w / (data.length - 1)
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / (max - min)) * height}`)
    .join(' ')
  // Threshold lines
  const thresholdY = (lvl) => height - (lvl / max) * height
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <line x1="0" x2={w} y1={thresholdY(71)} y2={thresholdY(71)} stroke="rgba(251,146,60,0.4)" strokeDasharray="3 3" strokeWidth="0.5" />
      <line x1="0" x2={w} y1={thresholdY(86)} y2={thresholdY(86)} stroke="rgba(239,68,68,0.4)" strokeDasharray="3 3" strokeWidth="0.5" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function RiskGauge({ score, level }) {
  const color = RISK_LEVEL_COLOR[level]
  const pct = Math.max(0, Math.min(100, score)) / 100
  // Half-donut
  const r = 60
  const c = Math.PI * r
  return (
    <div style={{ position: 'relative', width: 200, height: 110 }}>
      <svg width="200" height="110" viewBox="0 0 200 110">
        <path d={`M 30 100 A 70 70 0 0 1 170 100`} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M 30 100 A 70 70 0 0 1 170 100`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>{score}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.18em' }}>{level}</div>
      </div>
    </div>
  )
}

export default function RiskMonitor({ open, onClose, sim }) {
  const { risk, riskHistory, preAlertActive, preAlertFiredAt, simulationStatus } = sim
  const { score, level, factors, confidence, predictionWindowSec, topFloors } = risk
  const color = RISK_LEVEL_COLOR[level]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-bg-secondary shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Predictive risk monitor</div>
                <div className="text-base font-semibold text-white mt-0.5">Ambient threat surface — live</div>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-text-secondary text-xs hover:bg-white/10 hover:text-text-primary"
              >
                CLOSE
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gauge + history */}
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4 flex flex-col items-center">
                  <RiskGauge score={score} level={level} />
                  <div className="mt-2 text-xs text-text-secondary text-center" style={{ fontFamily: 'monospace' }}>
                    {predictionWindowSec
                      ? <>Predicted incident in <span style={{ color }}>{predictionWindowSec} s</span> · {confidence}% confidence</>
                      : 'Within normal operating range'}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1">Risk over last 60 s</div>
                  <Sparkline data={riskHistory} color={color} />
                  <div className="flex justify-between text-[9px] text-text-secondary font-mono mt-1">
                    <span>−60s</span><span>NOW</span>
                  </div>
                </div>

                {preAlertActive && (
                  <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
                    <div className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">Pre-alert active</div>
                    {preAlertFiredAt != null && simulationStatus === 'pre-crisis' && (
                      <div className="text-[10px] text-amber-200 font-mono mt-0.5">
                        Lead time before crisis: T−{preAlertFiredAt}s
                      </div>
                    )}
                    <ul className="mt-2 space-y-1">
                      {PRE_ACTIONS.map((a) => (
                        <li key={a} className="text-[11px] text-amber-100 flex items-start gap-1.5">
                          <span className="text-amber-300 mt-0.5">▸</span><span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Factor breakdown */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-3">Active risk factors</div>
                  <div className="space-y-1.5">
                    {factors.length === 0 && (
                      <div className="text-xs text-text-secondary italic">No elevated factors detected.</div>
                    )}
                    {factors.map((f) => (
                      <div key={f.key} className="flex items-center justify-between bg-white/[0.03] rounded px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span style={{ width: 14, fontSize: 11, color: f.trend === 'up' ? '#fb923c' : f.trend === 'down' ? '#3b82f6' : '#64748b' }}>
                            {f.trend === 'up' ? '↑' : f.trend === 'down' ? '↓' : '·'}
                          </span>
                          <span className="text-xs text-text-primary">{f.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 bg-white/5 rounded overflow-hidden">
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, f.score * 2.5)}%`,
                                background: f.score >= 18 ? '#ef4444' : f.score >= 10 ? '#fb923c' : '#3b82f6',
                                transition: 'width 0.6s ease',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-text-secondary w-6 text-right">+{f.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-3">Risk by floor</div>
                  <FloorRiskHeatmap topFloors={topFloors} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Header chip ─────────────────────────────────────────── */
export function RiskHeaderChip({ score, level, onClick, preAlert }) {
  const color = RISK_LEVEL_COLOR[level]
  return (
    <button
      onClick={onClick}
      title="Open predictive risk monitor"
      className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold uppercase tracking-widest transition-colors"
      style={{
        borderColor: color + '88',
        background: color + '15',
        color,
        boxShadow: preAlert ? `0 0 12px ${color}66` : 'none',
        animation: preAlert ? 'pulse 1.4s ease-in-out infinite' : 'none',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      Risk {score} <span className="opacity-70 font-normal">· {level}</span>
    </button>
  )
}
