import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import IncidentTimeline from '../Timeline/IncidentTimeline.jsx'
import AuditLog from '../AuditLog/AuditLog.jsx'
import IncidentMetrics from '../Metrics/IncidentMetrics.jsx'
import CounterfactualSimulator from '../Counterfactual/CounterfactualSimulator.jsx'
import PostIncidentReport from '../PostIncident/PostIncidentReport.jsx'

const TABS = [
  { key: 'timeline',       label: 'Timeline' },
  { key: 'audit',          label: 'Audit Log' },
  { key: 'metrics',        label: 'Metrics' },
  { key: 'counterfactual', label: 'What-If' },
  { key: 'report',         label: 'Report' },
]

export default function IncidentReviewPanel({ open, onClose, sim, drillMode, onCompare }) {
  const [tab, setTab] = useState('timeline')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-up overlay */}
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed left-0 right-0 bottom-0 z-50 h-[88vh] bg-bg-secondary/98 border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-accent-amber/15 border border-accent-amber/40 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="3" width="12" height="12" rx="2" stroke="#f59e0b" strokeWidth="1.4"/>
                    <path d="M9 6v3l2 2" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">
                    Phase 6 — Incident Review
                  </div>
                  <div className="text-base font-semibold text-white">
                    Timeline · Audit Log · Metrics
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onCompare && (
                  <button
                    onClick={onCompare}
                    className="px-3 py-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                  >
                    Compare Response
                  </button>
                )}
                <div className="flex rounded-lg bg-white/5 border border-white/10 p-1">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors ${
                        tab === t.key
                          ? 'bg-white text-bg-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="ml-2 w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
                  aria-label="Close incident review"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 p-6">
              {tab === 'timeline'       && <IncidentTimeline sim={sim} />}
              {tab === 'audit'          && <AuditLog sim={sim} />}
              {tab === 'metrics'        && <IncidentMetrics sim={sim} />}
              {tab === 'counterfactual' && <CounterfactualSimulator />}
              {tab === 'report'         && <PostIncidentReport sim={sim} drillMode={drillMode} />}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}
