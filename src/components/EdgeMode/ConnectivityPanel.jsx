import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SYSTEM_CHECKLIST } from '../../services/connectivityManager.js'

const MODE_META = {
  cloud:    { color: '#22c55e', label: 'CLOUD CONNECTED',  icon: '☁' },
  edge:     { color: '#fb923c', label: 'EDGE MODE',        icon: '⚡' },
  degraded: { color: '#f59e0b', label: 'DEGRADED CONN.',   icon: '⚠' },
}

export function ConnectivityChip({ mode, onClick }) {
  const meta = MODE_META[mode] ?? MODE_META.cloud
  return (
    <button
      onClick={onClick}
      title="Open connectivity panel"
      className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold uppercase tracking-widest transition-colors"
      style={{
        borderColor: meta.color + '88',
        background: meta.color + '15',
        color: meta.color,
      }}
    >
      <span style={{ fontSize: 11 }}>{meta.icon}</span>
      <span>{meta.label}</span>
    </button>
  )
}

export function ConnectivityBanner({ banner }) {
  if (!banner) return null
  const bg = banner.kind === 'amber'
    ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
    : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
  return (
    <AnimatePresence>
      <motion.div
        key={banner.text}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full border text-xs font-semibold tracking-widest uppercase ${bg}`}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {banner.text}
      </motion.div>
    </AnimatePresence>
  )
}

function fmtSec(s) {
  if (s == null) return '—'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export default function ConnectivityPanel({ open, onClose, sim }) {
  const { connState } = sim
  const meta = MODE_META[connState.mode] ?? MODE_META.cloud

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="w-full max-w-3xl rounded-2xl border border-white/10 bg-bg-secondary shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Network · Architecture</div>
                <div className="text-base font-semibold text-white mt-0.5">Edge / Cloud Connectivity</div>
              </div>
              <button onClick={onClose} className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-text-secondary text-xs hover:bg-white/10">CLOSE</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Big status badge */}
              <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: meta.color + '55', background: meta.color + '10' }}>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary">Current mode</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: meta.color }}>{meta.icon} {meta.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary">Edge latency</div>
                  <div className="text-lg font-mono text-text-primary">{connState.edgeLatencyMs} ms</div>
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">Cloud latency</div>
                  <div className="text-lg font-mono" style={{ color: connState.mode === 'cloud' ? '#22c55e' : '#64748b' }}>
                    {connState.mode === 'cloud' ? `${connState.cloudLatencyMs} ms` : 'OFFLINE'}
                  </div>
                </div>
              </div>

              {/* Sync state */}
              <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary">Cloud sync queue</div>
                  <div className="text-xs font-mono text-text-primary">{connState.pendingSync.length} pending</div>
                </div>
                {connState.syncProgress != null && (
                  <div className="h-1.5 bg-white/5 rounded overflow-hidden">
                    <div
                      style={{ width: `${connState.syncProgress * 100}%`, background: '#22c55e', height: '100%', transition: 'width 0.1s linear' }}
                    />
                  </div>
                )}
                {connState.offlineSinceMs && connState.mode === 'edge' && (
                  <div className="text-[10px] text-text-secondary font-mono">Offline duration: {fmtSec(connState.edgeDuration)}</div>
                )}
              </div>

              {/* Capability checklist */}
              <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4">
                <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-3">System availability while {connState.mode === 'edge' ? 'OFFLINE' : 'in current mode'}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SYSTEM_CHECKLIST.map((item) => {
                    const works = connState.mode === 'cloud' ? true : item.edge
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white/[0.03] rounded px-3 py-1.5">
                        <span className="text-[11px] text-text-primary">{item.label}</span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                          style={{
                            background: works ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: works ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {works ? '✓ EDGE' : item.fallback ? `↪ ${item.fallback}` : '✗ OFFLINE'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {connState.mode === 'cloud' && (
                  <>
                    <button
                      onClick={sim.simulateDisconnect}
                      className="flex-1 py-2 rounded bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-semibold uppercase tracking-widest hover:bg-amber-500/25"
                    >
                      Simulate Network Failure
                    </button>
                    <button
                      onClick={sim.simulateDegraded}
                      className="flex-1 py-2 rounded bg-yellow-500/15 border border-yellow-400/40 text-yellow-200 text-xs font-semibold uppercase tracking-widest hover:bg-yellow-500/25"
                    >
                      Simulate Degraded Conn
                    </button>
                  </>
                )}
                {connState.mode !== 'cloud' && (
                  <button
                    onClick={sim.simulateReconnect}
                    className="flex-1 py-2 rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-semibold uppercase tracking-widest hover:bg-emerald-500/25"
                  >
                    Restore Cloud Connection
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
