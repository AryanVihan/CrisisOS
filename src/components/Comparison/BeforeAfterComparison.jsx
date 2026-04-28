import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/* ── Timeline data ───────────────────────────────────────────── */
const WITHOUT_TIMELINE = [
  { t: 0,    label: 'T+0:00',  text: 'Fire starts',                                          tone: 'neutral' },
  { t: 150,  label: 'T+2:30',  text: 'Guest notices smoke, calls front desk',                tone: 'warn' },
  { t: 240,  label: 'T+4:00',  text: 'Front desk calls manager',                             tone: 'warn' },
  { t: 390,  label: 'T+6:30',  text: 'Manager manually calls 911',                           tone: 'critical' },
  { t: 480,  label: 'T+8:00',  text: 'Staff begin informal evacuation',                      tone: 'critical' },
  { t: 660,  label: 'T+11:00', text: 'First responders arrive with minimal briefing',        tone: 'critical' },
  { t: 840,  label: 'T+14:00', text: 'Evacuation complete (estimated)',                      tone: 'warn' },
  { t: 1080, label: 'T+18:00', text: 'All guests accounted for (estimated)',                 tone: 'neutral' },
]

const WITH_TIMELINE = [
  { t: 0,  label: 'T+0:00', text: 'Fire starts',                                              tone: 'neutral' },
  { t: 3,  label: 'T+0:03', text: 'Sensor detection',                                         tone: 'good' },
  { t: 18, label: 'T+0:18', text: 'AI analysis complete',                                     tone: 'good' },
  { t: 28, label: 'T+0:28', text: 'Emergency services dispatched with full brief',           tone: 'good' },
  { t: 38, label: 'T+0:38', text: 'Evacuation underway',                                      tone: 'good' },
  { t: 52, label: 'T+0:52', text: 'All guests moving to exits',                               tone: 'good' },
  { t: 75, label: 'T+1:15', text: 'All guests accounted for',                                 tone: 'good' },
]

const COMPARISON_ROWS = [
  { metric: 'Detection time',     without: '~150 s',         with: '3 s' },
  { metric: 'Coordination',       without: '~8 min',         with: '52 s' },
  { metric: 'Responder brief',    without: 'None',           with: 'Auto-generated' },
  { metric: 'Accountability',     without: 'Manual / unknown', with: 'Real-time' },
  { metric: 'Injuries (projected)', without: '2–3',          with: '0' },
]

const TONE_CLASSES = {
  good:     { dot: 'bg-emerald-400',  text: 'text-emerald-300' },
  warn:     { dot: 'bg-amber-400',    text: 'text-amber-300'   },
  critical: { dot: 'bg-rose-400',     text: 'text-rose-300'    },
  neutral:  { dot: 'bg-white/40',     text: 'text-white/80'    },
}

/* ── Single side timeline ────────────────────────────────────── */
function SideTimeline({ title, subtitle, accent, items, totals, totalsLabel, totalsTone }) {
  return (
    <div className={`flex flex-col rounded-2xl border ${accent.border} ${accent.bg} p-4 h-full overflow-hidden`}>
      <div>
        <div className={`text-[10px] uppercase tracking-[0.3em] ${accent.label}`}>{subtitle}</div>
        <div className="text-lg font-bold text-white">{title}</div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it, idx) => {
            const tone = TONE_CLASSES[it.tone] ?? TONE_CLASSES.neutral
            return (
              <motion.div
                key={`${it.label}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2.5 rounded-lg bg-black/20 border border-white/5 px-3 py-2"
              >
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] text-text-secondary">{it.label}</div>
                  <div className={`text-xs ${tone.text} leading-snug`}>{it.text}</div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className={`mt-3 rounded-lg border ${accent.totalBorder} ${accent.totalBg} px-3 py-2 text-center`}>
        <div className="text-[10px] uppercase tracking-[0.25em] text-text-secondary">Total</div>
        <div className={`mt-0.5 text-lg font-bold ${totalsTone}`}>{totals}</div>
        <div className="text-[10px] text-text-secondary">{totalsLabel}</div>
      </div>
    </div>
  )
}

/* ── Animation orchestration ─────────────────────────────────── */
function useStaggeredReveal(items, intervalMs, isOpen) {
  const [visibleCount, setVisibleCount] = useState(0)
  useEffect(() => {
    if (!isOpen) { setVisibleCount(0); return }
    setVisibleCount(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setVisibleCount(i)
      if (i >= items.length) clearInterval(id)
    }, intervalMs)
    return () => clearInterval(id)
  }, [isOpen, items, intervalMs])
  return items.slice(0, visibleCount)
}

/* ── Modal ───────────────────────────────────────────────────── */
export default function BeforeAfterComparison({ open, onClose }) {
  // Two synchronized reveals — paced so both finish around the same time
  const withoutItems = useStaggeredReveal(WITHOUT_TIMELINE, 360, open)
  const withItems    = useStaggeredReveal(WITH_TIMELINE,    420, open)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const withoutAccent = {
    border: 'border-rose-900/60',
    bg: 'bg-rose-950/50',
    label: 'text-rose-300',
    totalBorder: 'border-rose-700/50',
    totalBg: 'bg-rose-900/40',
  }
  const withAccent = {
    border: 'border-emerald-900/60',
    bg: 'bg-emerald-950/40',
    label: 'text-emerald-300',
    totalBorder: 'border-emerald-700/50',
    totalBg: 'bg-emerald-900/40',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 bg-bg-secondary/98 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">
                    Phase 7 — Comparison
                  </div>
                  <div className="text-base font-semibold text-white">
                    Response time: traditional vs CrisisOS
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
                  aria-label="Close comparison"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[420px]">
                  <SideTimeline
                    title="WITHOUT CrisisOS"
                    subtitle="Manual coordination"
                    accent={withoutAccent}
                    items={withoutItems}
                    totals="18 minutes"
                    totalsLabel="2 guests with smoke inhalation"
                    totalsTone="text-rose-200"
                  />
                  <SideTimeline
                    title="WITH CrisisOS"
                    subtitle="Autonomous coordination"
                    accent={withAccent}
                    items={withItems}
                    totals="75 seconds"
                    totalsLabel="0 injuries"
                    totalsTone="text-emerald-200"
                  />
                </div>

                {/* Comparison table */}
                <div className="rounded-2xl border border-white/10 bg-bg-primary/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Side-by-side metrics</div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-text-secondary">
                        <th className="text-left px-4 py-2 font-semibold">Metric</th>
                        <th className="text-left px-4 py-2 font-semibold text-rose-300">Without CrisisOS</th>
                        <th className="text-left px-4 py-2 font-semibold text-emerald-300">With CrisisOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_ROWS.map((row, i) => (
                        <tr key={row.metric} className={`border-t border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                          <td className="px-4 py-2 text-text-primary">{row.metric}</td>
                          <td className="px-4 py-2 font-mono text-rose-200">{row.without}</td>
                          <td className="px-4 py-2 font-mono text-emerald-200">{row.with}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/20 px-4 py-3 text-center">
                  <span className="text-emerald-300 text-sm font-semibold">
                    14× faster to full accountability · zero projected injuries · auto-generated responder brief
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
