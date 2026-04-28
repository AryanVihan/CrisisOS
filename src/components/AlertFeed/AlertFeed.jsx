import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/* ── Icons per event type ────────────────────────────────────── */
function FireIcon()   { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C4 3 3 4.5 4 6C3 6 2 7 3 8.5C2.5 9 2.5 10 4 11H8C9.5 10 9.5 9 9 8.5C10 7 9 6 8 6C9 4.5 8 3 6 1Z" fill="#ef4444" fillOpacity="0.8"/></svg> }
function SmokeIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8C2 6 3 5 4 5.5C4 4 5 3 6 3.5C6 2 7 1.5 8 2C9 3 8.5 5 7.5 5.5C8.5 6 8 7.5 7 8C8 9 7 10 6 10H4C3 10 2 9.5 2 8Z" fill="#f59e0b" fillOpacity="0.8"/></svg> }
function MotionIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="3" r="1.5" fill="#3b82f6" fillOpacity="0.8"/><path d="M4 5C4 4.5 5 4 6 4S8 4.5 8 5V8H7V11H5V8H4Z" fill="#3b82f6" fillOpacity="0.8"/></svg> }
function CO2Icon()    { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="4.5" ry="3" stroke="#22c55e" strokeWidth="1" fill="none"/><text x="6" y="8.5" textAnchor="middle" fontSize="3" fill="#22c55e" fontFamily="monospace">CO₂</text></svg> }
function SOSIcon()    { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.5"/><text x="6" y="9" textAnchor="middle" fontSize="5" fill="#ef4444" fontFamily="sans-serif" fontWeight="bold">!</text></svg> }
function CCTVIcon()   { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="7" height="6" rx="1" stroke="#94a3b8" strokeWidth="1"/><path d="M8 5L11 4V8L8 7" stroke="#94a3b8" strokeWidth="1" strokeLinejoin="round"/></svg> }

const TYPE_ICON = { temperature: FireIcon, smoke: SmokeIcon, motion: MotionIcon, co2: CO2Icon, sos: SOSIcon, cctv: CCTVIcon }

/* ── Severity pill ───────────────────────────────────────────── */
const SEV_STYLE = {
  CRITICAL: 'bg-accent-red/20 text-accent-red',
  HIGH:     'bg-accent-amber/20 text-accent-amber',
  MEDIUM:   'bg-accent-blue/20 text-accent-blue',
  LOW:      'bg-white/10 text-text-secondary',
}

/* ── Single entry ────────────────────────────────────────────── */
function AlertEntry({ event }) {
  const Icon = TYPE_ICON[event.type] ?? SOSIcon
  const sevStyle = SEV_STYLE[event.severity] ?? SEV_STYLE.LOW
  const isAck = event.acknowledged

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: isAck ? 0.45 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex gap-2 py-2 px-2.5 rounded border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
    >
      {/* Left: timestamp + icon */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <span className="text-[9px] font-mono text-text-secondary leading-none">{event.timeLabel}</span>
        <Icon />
      </div>

      {/* Right: message + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={`text-[9px] px-1.5 py-px rounded font-semibold ${sevStyle}`}>
            {event.severity}
          </span>
          <span className="text-[9px] px-1.5 py-px rounded bg-white/10 text-text-secondary">
            {event.floor}
          </span>
          {event.zone && (
            <span className="text-[9px] text-text-secondary truncate max-w-[80px]">{event.zone}</span>
          )}
        </div>
        <p className="text-[10px] text-text-primary leading-snug line-clamp-2">{event.message}</p>
      </div>
    </motion.div>
  )
}

/* ── AlertFeed ───────────────────────────────────────────────── */
export default function AlertFeed({ events }) {
  const bottomRef = useRef(null)
  const visible = events.slice(-20)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <div className="text-3xl mb-2 opacity-20">📡</div>
        <div className="text-xs">No events yet</div>
        <div className="text-[10px] mt-1 opacity-60">Trigger a scenario to begin</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto px-2 py-2 h-full">
      <AnimatePresence initial={false}>
        {visible.map(ev => (
          <AlertEntry key={ev.id} event={ev} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
